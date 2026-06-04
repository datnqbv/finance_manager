import { RecurringTransaction, Wallet } from '../models/sequelize/index.js';

// @desc    Get all recurring transaction rules
// @route   GET /api/recurring-transactions
// @access  Private
export const getRecurringTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = parseInt(limit) === -1 ? 0 : Math.min(parseInt(limit) || 10, 500);
    const skip = (pageNum - 1) * limitNum;

    const where = { userId: req.user.id };

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
    
    return res.json({
      success: true,
      count: rules.length,
      total,
      page: pageNum,
      totalPages: limitNum > 0 ? Math.ceil(total / limitNum) : 1,
      data: rules
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create recurring transaction rule
// @route   POST /api/recurring-transactions
// @access  Private
export const createRecurringTransaction = async (req, res) => {
  try {
    const { type, category, amount, note, frequency, startDate, endDate, walletId, toWalletId } = req.body;
    
    // Validation
    const numAmount = Number(amount);
    if (!amount || Number.isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Số tiền không hợp lệ' });
    }
    
    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)) {
      return res.status(400).json({ success: false, message: 'Tần suất không hợp lệ' });
    }
    
    if (!startDate) {
      return res.status(400).json({ success: false, message: 'Ngày bắt đầu không được để trống' });
    }
    
    // Check wallet
    let actualWalletId = walletId;
    if (!actualWalletId) {
      const defWallet = await Wallet.findOne({ where: { userId: req.user.id, isDefault: true } });
      if (!defWallet) {
        return res.status(400).json({ success: false, message: 'Bạn chưa có ví mặc định. Vui lòng tạo ví trước.' });
      }
      actualWalletId = defWallet.id;
    }
    
    const wallet = await Wallet.findOne({ where: { id: actualWalletId, userId: req.user.id } });
    if (!wallet) {
      return res.status(400).json({ success: false, message: 'Ví nguồn không hợp lệ' });
    }
    
    // Validate transfer wallets
    if (type === 'transfer') {
      if (!toWalletId) {
        return res.status(400).json({ success: false, message: 'Ví nhận không được để trống' });
      }
      if (toWalletId === actualWalletId) {
        return res.status(400).json({ success: false, message: 'Ví nhận và ví nguồn không được trùng nhau' });
      }
      const targetWallet = await Wallet.findOne({ where: { id: toWalletId, userId: req.user.id } });
      if (!targetWallet) {
        return res.status(400).json({ success: false, message: 'Ví nhận không hợp lệ' });
      }
    }
    
    const rule = await RecurringTransaction.create({
      userId: req.user.id,
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
    
    return res.status(201).json({
      success: true,
      message: 'Tạo thiết lập giao dịch định kỳ thành công',
      data: rule
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update recurring transaction rule (including pause/resume)
// @route   PUT /api/recurring-transactions/:id
// @access  Private
export const updateRecurringTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, category, amount, note, frequency, startDate, endDate, walletId, toWalletId, isActive } = req.body;
    
    const rule = await RecurringTransaction.findByPk(id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch định kỳ này' });
    }
    
    if (rule.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Không có quyền sửa đổi' });
    }
    
    // If updating wallet or amount, run validation
    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (Number.isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Số tiền không hợp lệ' });
      }
      rule.amount = numAmount;
    }
    
    if (walletId) {
      const wallet = await Wallet.findOne({ where: { id: walletId, userId: req.user.id } });
      if (!wallet) {
        return res.status(400).json({ success: false, message: 'Ví nguồn không hợp lệ' });
      }
      rule.walletId = walletId;
    }
    
    if (type === 'transfer' && toWalletId) {
      if (toWalletId === rule.walletId) {
        return res.status(400).json({ success: false, message: 'Ví nhận và ví nguồn không được trùng nhau' });
      }
      const targetWallet = await Wallet.findOne({ where: { id: toWalletId, userId: req.user.id } });
      if (!targetWallet) {
        return res.status(400).json({ success: false, message: 'Ví nhận không hợp lệ' });
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
    
    return res.json({
      success: true,
      message: 'Cập nhật giao dịch định kỳ thành công',
      data: rule
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete recurring transaction rule
// @route   DELETE /api/recurring-transactions/:id
// @access  Private
export const deleteRecurringTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    
    const rule = await RecurringTransaction.findByPk(id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch định kỳ này' });
    }
    
    if (rule.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Không có quyền xóa' });
    }
    
    await rule.destroy();
    
    return res.json({
      success: true,
      message: 'Xóa giao dịch định kỳ thành công'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
