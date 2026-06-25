import { Transaction, Notification, Budget, Wallet, User, sequelize } from '../models/sequelize/index.js';
import { Op } from 'sequelize';
import { getSearchCondition } from '../utils/fts.js';
import { recalculateWalletBalance } from '../controllers/wallet.controller.js';
import { sendBudgetAlertEmail } from '../utils/sendEmail.js';
import ErrorResponse from '../utils/errorResponse.js';

// Helper function to get date range based on period
const getDateRange = (period, startDate = new Date()) => {
  const start = new Date(startDate);
  const end = new Date(startDate);

  switch (period) {
    case 'weekly':
      start.setDate(start.getDate() - start.getDay());
      end.setDate(start.getDate() + 6);
      break;
    case 'monthly':
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      break;
    case 'yearly':
      start.setMonth(0, 1);
      end.setMonth(11, 31);
      break;
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

export const checkBudgetAndNotify = async (userId, category, transactionDate) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) return;

    // Tìm các budget liên quan 
    const budgets = await Budget.findAll({ where: { userId, isActive: true, [Op.or]: [{ categoryName: category }, { categoryName: null }] }, raw: true });

    for (const budget of budgets) {
      const dateRange = getDateRange(budget.period);

      // Tính tổng chi tiêu (chỉ giao dịch gốc, bỏ qua con tách)
      const where = { userId, type: 'expense', parentId: null, date: { [Op.between]: [dateRange.start, dateRange.end] } };
      if (budget.categoryName) where.category = budget.categoryName;
      const rows = await Transaction.findAll({ where, attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total']], raw: true });
      const currentSpending = rows && rows.length > 0 ? parseFloat(rows[0].total) || 0 : 0;
      const percentage = (currentSpending / budget.amount) * 100;

      // Tạo thông báo nếu vượt ngưỡng 80% hoặc 100%
      if (percentage >= 100) {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentNotif = await Notification.findOne({ where: { userId, type: 'error', relatedModel: 'Budget', createdAt: { [Op.gte]: cutoff } }, order: [['createdAt', 'DESC']] });
        let existsForBudget = false;
        if (recentNotif) {
          try { const meta = recentNotif.metadata || (recentNotif.get && recentNotif.get('metadata')); const bId = meta && meta.budgetId; if (bId && (bId === (budget.id || budget._id).toString())) existsForBudget = true; } catch (e) { }
        }
        if (!existsForBudget) {
          await Notification.create({ userId, type: 'error', title: '🚨 Vượt ngân sách!', message: `${budget.categoryName || 'Tổng ngân sách'}: Đã vượt ${percentage.toFixed(0)}% (${currentSpending.toLocaleString('vi-VN')}/${budget.amount.toLocaleString('vi-VN')} ₫)`, relatedId: budget.id || budget._id, relatedModel: 'Budget', read: false, metadata: { budgetId: (budget.id || budget._id).toString(), category: budget.categoryName, percentage: percentage.toFixed(0), currentSpending, budgetAmount: budget.amount } });

          sendBudgetAlertEmail(user.email, user.name, {
            categoryName: budget.categoryName,
            period: budget.period,
            amount: budget.amount,
            currentSpending,
            percentage
          }).catch(err => console.error('Error in sendBudgetAlertEmail (100%):', err));
        }
      } else if (percentage >= 80) {
        const cutoffW = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentWarn = await Notification.findOne({ where: { userId, type: 'warning', relatedModel: 'Budget', createdAt: { [Op.gte]: cutoffW } }, order: [['createdAt', 'DESC']] });
        let existsWarn = false;
        if (recentWarn) { try { const meta = recentWarn.metadata || (recentWarn.get && recentWarn.get('metadata')); const bId = meta && meta.budgetId; if (bId && (bId === (budget.id || budget._id).toString())) existsWarn = true; } catch (e) { } }
        if (!existsWarn) {
          await Notification.create({ userId, type: 'warning', title: '⚠️ Cảnh báo ngân sách', message: `${budget.categoryName || 'Tổng ngân sách'}: Đã sử dụng ${percentage.toFixed(0)}% (${currentSpending.toLocaleString('vi-VN')}/${budget.amount.toLocaleString('vi-VN')} ₫)`, relatedId: budget.id || budget._id, relatedModel: 'Budget', read: false, metadata: { budgetId: (budget.id || budget._id).toString(), category: budget.categoryName, percentage: percentage.toFixed(0), currentSpending, budgetAmount: budget.amount } });

          sendBudgetAlertEmail(user.email, user.name, {
            categoryName: budget.categoryName,
            period: budget.period,
            amount: budget.amount,
            currentSpending,
            percentage
          }).catch(err => console.error('Error in sendBudgetAlertEmail (80%):', err));
        }
      }
    }
  } catch (error) {
    console.error('Error checking budget:', error);
  }
};

// Tách 1 giao dịch thành nhiều danh mục con
export const splitTransaction = async (userId, transactionId, splits) => {
  const t = await sequelize.transaction();
  try {
    const parent = await Transaction.findByPk(transactionId, { transaction: t });
    if (!parent) throw new ErrorResponse('Không tìm thấy giao dịch', 404);
    if (parent.userId !== userId) throw new ErrorResponse('Không có quyền truy cập', 403);
    if (parent.type === 'transfer') throw new ErrorResponse('Không thể tách giao dịch chuyển khoản', 400);
    if (parent.parentId) throw new ErrorResponse('Không thể tách giao dịch con', 400);

    // Kiểm tra đã tách chưa
    const existingChildren = await Transaction.count({ where: { parentId: transactionId }, transaction: t });
    if (existingChildren > 0) throw new ErrorResponse('Giao dịch này đã được tách rồi', 400);

    if (!splits || splits.length < 2) throw new ErrorResponse('Cần ít nhất 2 phần để tách', 400);

    // Tổng các phần tách phải bằng số tiền gốc
    const totalSplit = splits.reduce((sum, s) => sum + Number(s.amount), 0);
    const parentAmount = Number(parent.amount);
    if (Math.abs(totalSplit - parentAmount) > 0.01) {
      throw new ErrorResponse(`Tổng các phần tách (${totalSplit.toLocaleString('vi-VN')}₫) phải bằng số tiền gốc (${parentAmount.toLocaleString('vi-VN')}₫)`, 400);
    }

    // Tạo các giao dịch con (chỉ phục vụ phân loại, không ảnh hưởng ví)
    const children = [];
    for (const split of splits) {
      if (!split.category || !split.amount || Number(split.amount) <= 0) {
        throw new ErrorResponse('Mỗi phần tách cần có danh mục và số tiền hợp lệ', 400);
      }
      const child = await Transaction.create({
        userId,
        type: parent.type,
        category: split.category,
        amount: Number(split.amount),
        note: split.note || parent.note || '',
        date: parent.date,
        walletId: parent.walletId,
        parentId: transactionId,
      }, { transaction: t });
      children.push(child);
    }

    // Kiểm tra ngân sách cho từng danh mục con (nếu là chi tiêu)
    await t.commit();

    if (parent.type === 'expense') {
      for (const child of children) {
        checkBudgetAndNotify(userId, child.category, child.date).catch(err =>
          console.error('Error checking budget for split child:', err)
        );
      }
    }

    return { parent, children };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// Gỡ tách giao dịch (xóa tất cả giao dịch con)
export const unsplitTransaction = async (userId, transactionId) => {
  const t = await sequelize.transaction();
  try {
    const parent = await Transaction.findByPk(transactionId, { transaction: t });
    if (!parent) throw new ErrorResponse('Không tìm thấy giao dịch', 404);
    if (parent.userId !== userId) throw new ErrorResponse('Không có quyền truy cập', 403);

    const deleted = await Transaction.destroy({ where: { parentId: transactionId }, transaction: t });
    if (deleted === 0) throw new ErrorResponse('Giao dịch này chưa được tách', 400);

    await t.commit();
    return parent;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const getTransactions = async (userId, query) => {
  const {
    type, category, startDate, endDate,
    search, amountMin, amountMax, walletId, tag,
    page = 1, limit = 10,
    sortBy = 'date', sortOrder = 'desc'
  } = query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = parseInt(limit) === -1 ? 0 : Math.min(parseInt(limit) || 10, 500);
  const skip = (pageNum - 1) * limitNum;

  const where = { userId, parentId: null };
  if (search) {
    where[Op.and] = [getSearchCondition(['category', 'note', 'tags'], search)];
  }
  if (type) where.type = type;
  if (category) {
    if (sequelize.options.dialect === 'mssql') {
      const escaped = category.replace(/'/g, "''");
      where.category = sequelize.literal(`category LIKE N'%${escaped}%' COLLATE Latin1_General_CI_AI`);
    } else {
      where.category = { [Op.like]: `%${category}%` };
    }
  }
  if (tag) {
    if (sequelize.options.dialect === 'mssql') {
      const escapedTag = tag.replace(/'/g, "''");
      where.tags = sequelize.literal(`tags LIKE N'%${escapedTag}%' COLLATE Latin1_General_CI_AI`);
    } else {
      where.tags = { [Op.like]: `%${tag}%` };
    }
  }
  if (walletId) {
    where[Op.or] = [
      { walletId: walletId },
      { toWalletId: walletId }
    ];
  }
  if (startDate || endDate) {
    where.date = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      where.date[Op.gte] = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.date[Op.lte] = end;
    }
  }
  if (amountMin || amountMax) {
    where.amount = {};
    if (amountMin) where.amount[Op.gte] = parseFloat(amountMin);
    if (amountMax) where.amount[Op.lte] = parseFloat(amountMax);
  }

  const order = [[sortBy, sortOrder === 'asc' ? 'ASC' : 'DESC']];

  const [transactions, totalFound] = await Promise.all([
    Transaction.findAll({
      where,
      order,
      offset: limitNum > 0 ? skip : undefined,
      limit: limitNum || undefined,
      include: [
        { model: Wallet, as: 'wallet', attributes: ['id', 'name', 'icon', 'color'] },
        { model: Wallet, as: 'toWallet', attributes: ['id', 'name', 'icon', 'color'] },
        { model: Transaction, as: 'splitChildren', required: false, attributes: ['id', 'category', 'amount', 'note'] }
      ]
    }),
    Transaction.count({ where })
  ]);

  return {
    count: transactions.length,
    total: totalFound,
    page: pageNum,
    totalPages: limitNum > 0 ? Math.ceil(totalFound / limitNum) : 1,
    data: transactions
  };
};

export const getTransactionById = async (userId, id) => {
  const transaction = await Transaction.findByPk(id);
  if (!transaction) {
    throw new ErrorResponse('Không tìm thấy giao dịch', 404);
  }
  if (transaction.userId !== userId) {
    throw new ErrorResponse('Không có quyền truy cập', 403);
  }
  return transaction;
};

export const createTransaction = async (userId, data) => {
  const t = await sequelize.transaction();
  try {
    const { type, category, amount, note, date, walletId, toWalletId, receiptUrl, tags } = data;
    const numAmount = Number(amount);
    if (!amount || Number.isNaN(numAmount) || numAmount <= 0) {
      throw new ErrorResponse('Số tiền không hợp lệ', 400);
    }

    let actualWalletId = walletId;
    if (!actualWalletId) {
      const defWallet = await Wallet.findOne({ where: { userId, isDefault: true }, transaction: t });
      if (!defWallet) {
        throw new ErrorResponse('Bạn chưa có ví mặc định. Vui lòng tạo ví trước.', 400);
      }
      actualWalletId = defWallet.id;
    }

    const wallet = await Wallet.findOne({ where: { id: actualWalletId, userId }, transaction: t });
    if (!wallet) {
      throw new ErrorResponse('Ví không hợp lệ', 400);
    }

    let targetWallet = null;
    if (type === 'transfer') {
      if (!toWalletId) throw new ErrorResponse('Ví nhận không được để trống khi chuyển khoản', 400);
      if (toWalletId === actualWalletId) throw new ErrorResponse('Ví nhận và ví nguồn không được trùng nhau', 400);
      targetWallet = await Wallet.findOne({ where: { id: toWalletId, userId }, transaction: t });
      if (!targetWallet) throw new ErrorResponse('Ví nhận không hợp lệ', 400);
    }

    const createdTx = await Transaction.create({
      userId,
      type,
      category: type === 'transfer' ? 'Chuyển khoản' : category,
      amount: numAmount,
      note,
      date: date || Date.now(),
      walletId: actualWalletId,
      toWalletId: type === 'transfer' ? toWalletId : null,
      receiptUrl: receiptUrl || null,
      tags: Array.isArray(tags) ? JSON.stringify(tags) : (tags || null)
    }, { transaction: t });

    // Recalculate wallet balances (assuming recalculateWalletBalance expects { transaction: t })
    await recalculateWalletBalance(actualWalletId, { transaction: t });
    if (type === 'transfer' && toWalletId) {
      await recalculateWalletBalance(toWalletId, { transaction: t });
    }

    // Notifications
    const transactionDate = new Date();
    const formattedDate = transactionDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formattedTime = transactionDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const isLargeTransaction = amount >= 1000000;

    let notificationTitle, notificationType, notificationMessage;

    if (type === 'transfer') {
      const fromW = wallet ? wallet.name : 'ví nguồn';
      const toW = targetWallet ? targetWallet.name : 'ví đích';
      notificationTitle = '⇆ Giao dịch chuyển khoản';
      notificationType = 'transaction';
      notificationMessage = `Vào lúc ${formattedTime} ngày ${formattedDate}, bạn đã chuyển khoản ${amount.toLocaleString('vi-VN')} ₫ từ ví "${fromW}" sang ví "${toW}"${note ? ` - ${note}` : ''}`;
    } else {
      const typeText = type === 'income' ? 'thu nhập' : 'chi tiêu';
      if (isLargeTransaction) {
        notificationTitle = type === 'income' ? '💰 Thu nhập lớn!' : '🚨 Chi tiêu lớn!';
        notificationType = type === 'income' ? 'success' : 'warning';
      } else {
        notificationTitle = type === 'income' ? '💰 Giao dịch thu nhập' : '💸 Giao dịch chi tiêu';
        notificationType = 'transaction';
      }
      notificationMessage = `Vào lúc ${formattedTime} ngày ${formattedDate}, bạn đã ${typeText} ${amount.toLocaleString('vi-VN')} ₫ cho "${category}"${note ? ` - ${note}` : ''}`;
    }

    await Notification.create({ userId, type: notificationType, title: notificationTitle, message: notificationMessage, relatedId: createdTx.id, relatedModel: 'Transaction', read: false, metadata: { transactionType: type, category, amount, date: createdTx.date, isLargeTransaction } }, { transaction: t });

    await t.commit();

    if (type === 'expense') {
      checkBudgetAndNotify(userId, category, createdTx.date).catch(err => console.error('Error checking budget:', err));
    }

    return createdTx;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const updateTransaction = async (userId, id, data) => {
  const t = await sequelize.transaction();
  try {
    let transactionRecord = await Transaction.findByPk(id, { transaction: t });
    if (!transactionRecord) {
      throw new ErrorResponse('Không tìm thấy giao dịch', 404);
    }

    if (transactionRecord.userId !== userId) {
      throw new ErrorResponse('Không có quyền truy cập', 403);
    }

    const oldWalletId = transactionRecord.walletId;
    const oldToWalletId = transactionRecord.toWalletId;

    const updateData = { ...data };
    if (updateData.type === 'transfer') {
      updateData.category = 'Chuyển khoản';
    }
    if (Array.isArray(updateData.tags)) {
      updateData.tags = JSON.stringify(updateData.tags);
    }

    await Transaction.update(updateData, { where: { id }, transaction: t });
    transactionRecord = await Transaction.findByPk(id, { transaction: t });

    if (oldWalletId) await recalculateWalletBalance(oldWalletId, { transaction: t });
    if (oldToWalletId) await recalculateWalletBalance(oldToWalletId, { transaction: t });

    if (transactionRecord.walletId && transactionRecord.walletId !== oldWalletId) {
      await recalculateWalletBalance(transactionRecord.walletId, { transaction: t });
    }
    if (transactionRecord.toWalletId && transactionRecord.toWalletId !== oldToWalletId) {
      await recalculateWalletBalance(transactionRecord.toWalletId, { transaction: t });
    }

    // Notification
    const transactionDate = new Date();
    const formattedDate = transactionDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formattedTime = transactionDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const typeText = transactionRecord.type === 'income' ? 'thu nhập' : 'chi tiêu';
    const notificationMessage = `Đã cập nhật giao dịch ${typeText} vào lúc ${formattedTime} ngày ${formattedDate}: ${transactionRecord.amount.toLocaleString('vi-VN')} ₫ cho "${transactionRecord.category}"`;

    await Notification.create({ userId, type: 'transaction', title: '✏️ Cập nhật giao dịch', message: notificationMessage, relatedId: transactionRecord.id || transactionRecord._id, relatedModel: 'Transaction', read: false, metadata: { transactionType: transactionRecord.type, category: transactionRecord.category, amount: transactionRecord.amount, date: transactionRecord.date } }, { transaction: t });

    await t.commit();

    if (transactionRecord.type === 'expense') {
      checkBudgetAndNotify(userId, transactionRecord.category, transactionRecord.date).catch(err => console.error('Error checking budget:', err));
    }

    return transactionRecord;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const deleteTransaction = async (userId, id) => {
  const t = await sequelize.transaction();
  try {
    const transactionRecord = await Transaction.findByPk(id, { transaction: t });
    if (!transactionRecord) {
      throw new ErrorResponse('Không tìm thấy giao dịch', 404);
    }
    if (transactionRecord.userId !== userId) {
      throw new ErrorResponse('Không có quyền truy cập', 403);
    }

    const walletId = transactionRecord.walletId;
    const toWalletId = transactionRecord.toWalletId;

    const transactionDate = new Date();
    const formattedDate = transactionDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formattedTime = transactionDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const typeText = transactionRecord.type === 'income' ? 'thu nhập' : 'chi tiêu';
    const notificationMessage = `Đã xóa giao dịch ${typeText} vào lúc ${formattedTime} ngày ${formattedDate}: ${transactionRecord.amount.toLocaleString('vi-VN')} ₫ cho "${transactionRecord.category}"`;

    await Notification.create({ userId, type: 'transaction', title: '🗑️ Xóa giao dịch', message: notificationMessage, relatedId: null, relatedModel: null, read: false, metadata: { transactionType: transactionRecord.type, category: transactionRecord.category, amount: transactionRecord.amount, date: transactionRecord.date, deleted: true } }, { transaction: t });

    // Xóa giao dịch con (nếu đã tách) trước khi xóa cha
    await Transaction.destroy({ where: { parentId: id }, transaction: t });
    await Transaction.destroy({ where: { id }, transaction: t });

    if (walletId) await recalculateWalletBalance(walletId, { transaction: t });
    if (toWalletId) await recalculateWalletBalance(toWalletId, { transaction: t });

    await t.commit();
    return true;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const bulkDeleteTransactions = async (userId, ids) => {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new ErrorResponse('Danh sách ID không hợp lệ', 400);
  }
  const t = await sequelize.transaction();
  try {
    const transactions = await Transaction.findAll({
      where: {
        id: { [Op.in]: ids },
        userId
      },
      transaction: t
    });

    if (transactions.length === 0) {
      throw new ErrorResponse('Không tìm thấy giao dịch nào để xóa', 404);
    }

    const walletIds = new Set();
    transactions.forEach(tx => {
      if (tx.walletId) walletIds.add(tx.walletId);
      if (tx.toWalletId) walletIds.add(tx.toWalletId);
    });

    const validIds = transactions.map(tx => tx.id);

    // Xóa các giao dịch con (nếu đã tách) trước
    await Transaction.destroy({
      where: { parentId: { [Op.in]: validIds } },
      transaction: t
    });

    // Xóa các giao dịch chính
    await Transaction.destroy({
      where: { id: { [Op.in]: validIds } },
      transaction: t
    });

    // Recalculate balances
    for (const wId of walletIds) {
      await recalculateWalletBalance(wId, { transaction: t });
    }

    // Tạo notification
    const notificationMessage = `Đã xóa hàng loạt ${validIds.length} giao dịch thành công.`;
    await Notification.create({
      userId,
      type: 'transaction',
      title: '🗑️ Xóa hàng loạt giao dịch',
      message: notificationMessage,
      read: false,
      metadata: { deletedCount: validIds.length, bulkAction: true }
    }, { transaction: t });

    await t.commit();
    return { deletedCount: validIds.length };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const bulkUpdateTransactions = async (userId, ids, updateData) => {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new ErrorResponse('Danh sách ID không hợp lệ', 400);
  }
  const t = await sequelize.transaction();
  try {
    const transactions = await Transaction.findAll({
      where: {
        id: { [Op.in]: ids },
        userId
      },
      transaction: t
    });

    if (transactions.length === 0) {
      throw new ErrorResponse('Không tìm thấy giao dịch nào để cập nhật', 404);
    }

    const walletIds = new Set();
    transactions.forEach(tx => {
      if (tx.walletId) walletIds.add(tx.walletId);
      if (tx.toWalletId) walletIds.add(tx.toWalletId);
    });

    // Filter updateData to only valid fields
    const validFields = ['type', 'category', 'walletId', 'date', 'note', 'tags'];
    const dataToUpdate = {};
    for (const field of validFields) {
      if (updateData[field] !== undefined && updateData[field] !== '') {
        dataToUpdate[field] = field === 'tags' && Array.isArray(updateData[field]) ? JSON.stringify(updateData[field]) : updateData[field];
      }
    }

    if (Object.keys(dataToUpdate).length === 0) {
      throw new ErrorResponse('Không có dữ liệu hợp lệ để cập nhật', 400);
    }

    if (dataToUpdate.walletId) {
      const wallet = await Wallet.findOne({ where: { id: dataToUpdate.walletId, userId }, transaction: t });
      if (!wallet) throw new ErrorResponse('Ví được chọn không hợp lệ', 400);
      walletIds.add(dataToUpdate.walletId);
    }

    if (dataToUpdate.type === 'transfer') {
      dataToUpdate.category = 'Chuyển khoản';
    }

    const validIds = transactions.map(tx => tx.id);

    await Transaction.update(dataToUpdate, {
      where: { id: { [Op.in]: validIds } },
      transaction: t
    });

    // Recalculate wallet balances
    for (const wId of walletIds) {
      await recalculateWalletBalance(wId, { transaction: t });
    }

    // Notification
    const notificationMessage = `Đã cập nhật hàng loạt ${validIds.length} giao dịch thành công.`;
    await Notification.create({
      userId,
      type: 'transaction',
      title: '✏️ Cập nhật hàng loạt giao dịch',
      message: notificationMessage,
      read: false,
      metadata: { updatedCount: validIds.length, bulkAction: true }
    }, { transaction: t });

    await t.commit();

    // Check budget for updated transactions if type is expense or category changed
    if (dataToUpdate.type === 'expense' || (dataToUpdate.category && dataToUpdate.type !== 'transfer' && dataToUpdate.type !== 'income')) {
      for (const tx of transactions) {
        const cat = dataToUpdate.category || tx.category;
        const date = dataToUpdate.date || tx.date;
        checkBudgetAndNotify(userId, cat, date).catch(err => console.error('Error checking budget bulk:', err));
      }
    }

    return { updatedCount: validIds.length };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};
