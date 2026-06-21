import { RecurringTransaction, Wallet } from '../models/sequelize/index.js';
import ErrorResponse from '../utils/errorResponse.js';

/**
 * Get all recurring transaction rules for a user
 */
export const getRecurringTransactions = async (userId, query) => {
  const { page = 1, limit = 10 } = query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = parseInt(limit) === -1 ? 0 : Math.min(parseInt(limit) || 10, 500);
  const skip = (pageNum - 1) * limitNum;

  const where = { userId };

  const [rules, total] = await Promise.all([
    RecurringTransaction.findAll({
      where,
      order: [['createdAt', 'DESC']],
      offset: limitNum > 0 ? skip : undefined,
      limit: limitNum || undefined,
      include: [
        { model: Wallet, as: 'wallet', attributes: ['id', 'name', 'icon', 'color'] },
        { model: Wallet, as: 'toWallet', attributes: ['id', 'name', 'icon', 'color'] }
      ]
    }),
    RecurringTransaction.count({ where })
  ]);
  
  return {
    count: rules.length,
    total,
    page: pageNum,
    totalPages: limitNum > 0 ? Math.ceil(total / limitNum) : 1,
    data: rules
  };
};

/**
 * Create a new recurring transaction rule
 */
export const createRecurringTransaction = async (userId, data) => {
  const { type, category, amount, note, frequency, startDate, endDate, walletId, toWalletId } = data;
  
  // Validation
  const numAmount = Number(amount);
  if (!amount || Number.isNaN(numAmount) || numAmount <= 0) {
    throw new ErrorResponse('Số tiền không hợp lệ', 400);
  }
  
  if (!['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)) {
    throw new ErrorResponse('Tần suất không hợp lệ', 400);
  }
  
  if (!startDate) {
    throw new ErrorResponse('Ngày bắt đầu không được để trống', 400);
  }
  
  // Check wallet
  let actualWalletId = walletId;
  if (!actualWalletId) {
    const defWallet = await Wallet.findOne({ where: { userId, isDefault: true } });
    if (!defWallet) {
      throw new ErrorResponse('Bạn chưa có ví mặc định. Vui lòng tạo ví trước.', 400);
    }
    actualWalletId = defWallet.id;
  }
  
  const wallet = await Wallet.findOne({ where: { id: actualWalletId, userId } });
  if (!wallet) {
    throw new ErrorResponse('Ví nguồn không hợp lệ', 400);
  }
  
  // Validate transfer wallets
  if (type === 'transfer') {
    if (!toWalletId) {
      throw new ErrorResponse('Ví nhận không được để trống', 400);
    }
    if (toWalletId === actualWalletId) {
      throw new ErrorResponse('Ví nhận và ví nguồn không được trùng nhau', 400);
    }
    const targetWallet = await Wallet.findOne({ where: { id: toWalletId, userId } });
    if (!targetWallet) {
      throw new ErrorResponse('Ví nhận không hợp lệ', 400);
    }
  }
  
  const rule = await RecurringTransaction.create({
    userId,
    type,
    walletId: actualWalletId,
    toWalletId: type === 'transfer' ? toWalletId : null,
    category: type === 'transfer' ? 'Chuyển khoản' : category,
    amount: numAmount,
    note,
    frequency,
    startDate,
    endDate: endDate || null,
    nextExecutionDate: startDate, // Runs initially on the start date
    isActive: true
  });
  
  return rule;
};

/**
 * Update an existing recurring transaction rule
 */
export const updateRecurringTransaction = async (userId, id, data) => {
  const { type, category, amount, note, frequency, startDate, endDate, walletId, toWalletId, isActive } = data;
  
  const rule = await RecurringTransaction.findByPk(id);
  if (!rule) {
    throw new ErrorResponse('Không tìm thấy giao dịch định kỳ này', 404);
  }
  
  if (rule.userId !== userId) {
    throw new ErrorResponse('Không có quyền sửa đổi', 403);
  }
  
  // If updating wallet or amount, run validation
  if (amount !== undefined) {
    const numAmount = Number(amount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      throw new ErrorResponse('Số tiền không hợp lệ', 400);
    }
    rule.amount = numAmount;
  }
  
  if (walletId) {
    const wallet = await Wallet.findOne({ where: { id: walletId, userId } });
    if (!wallet) {
      throw new ErrorResponse('Ví nguồn không hợp lệ', 400);
    }
    rule.walletId = walletId;
  }
  
  if (type === 'transfer' && toWalletId) {
    if (toWalletId === rule.walletId) {
      throw new ErrorResponse('Ví nhận và ví nguồn không được trùng nhau', 400);
    }
    const targetWallet = await Wallet.findOne({ where: { id: toWalletId, userId } });
    if (!targetWallet) {
      throw new ErrorResponse('Ví nhận không hợp lệ', 400);
    }
    rule.toWalletId = toWalletId;
  }
  
  if (category !== undefined) rule.category = type === 'transfer' ? 'Chuyển khoản' : category;
  if (type !== undefined) rule.type = type;
  if (note !== undefined) rule.note = note;
  if (frequency !== undefined) rule.frequency = frequency;
  if (startDate !== undefined) {
    rule.startDate = startDate;
    // Reset next execution if it hasn't run yet or we want to slide it
    if (!rule.lastExecutedAt) {
      rule.nextExecutionDate = startDate;
    }
  }
  if (endDate !== undefined) rule.endDate = endDate || null;
  if (isActive !== undefined) rule.isActive = !!isActive;
  
  await rule.save();
  return rule;
};

/**
 * Delete a recurring transaction rule
 */
export const deleteRecurringTransaction = async (userId, id) => {
  const rule = await RecurringTransaction.findByPk(id);
  if (!rule) {
    throw new ErrorResponse('Không tìm thấy giao dịch định kỳ này', 404);
  }
  
  if (rule.userId !== userId) {
    throw new ErrorResponse('Không có quyền xóa', 403);
  }
  
  await rule.destroy();
  return true;
};
