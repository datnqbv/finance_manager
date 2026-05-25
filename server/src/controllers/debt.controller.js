import { Debt } from '../models/sequelize/index.js';

// GET /api/debts
export const getDebts = async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = { userId: req.user.id };
    if (status) filter.status = status;
    if (type)   filter.type   = type;

    const debts = await Debt.findAll({ where: filter, order: [['createdAt','DESC']] });

    // Stats
    const all = await Debt.findAll({ where: { userId: req.user.id } });
    const stats = {
      totalLend:     all.filter(d => d.type === 'lend').reduce((s, d) => s + d.remainingAmount, 0),
      totalBorrow:   all.filter(d => d.type === 'borrow').reduce((s, d) => s + d.remainingAmount, 0),
      activeLend:    all.filter(d => d.type === 'lend'   && d.status === 'active').length,
      activeBorrow:  all.filter(d => d.type === 'borrow' && d.status === 'active').length,
    };

    res.json({ success: true, data: debts, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách nợ', error: err.message });
  }
};

// POST /api/debts
export const createDebt = async (req, res) => {
  try {
    const { type, personName, amount, description, dueDate } = req.body;
    const debt = await Debt.create({ userId: req.user.id,
      type,
      personName,
      amount,
      remainingAmount: amount,
      description: description || '',
      dueDate: dueDate || null
    });
    res.status(201).json({ success: true, message: 'Tạo khoản nợ thành công', data: debt });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Lỗi khi tạo khoản nợ', error: err.message });
  }
};

// PUT /api/debts/:id
export const updateDebt = async (req, res) => {
  try {
    const debt = await Debt.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!debt) return res.status(404).json({ success: false, message: 'Không tìm thấy khoản nợ' });

    const { personName, amount, description, dueDate } = req.body;
    if (personName)          debt.personName   = personName;
    if (description !== undefined) debt.description = description;
    if (dueDate !== undefined)     debt.dueDate     = dueDate || null;
    if (amount && amount > 0) {
      // Recalculate remaining proportionally
      const paidSoFar = debt.amount - debt.remainingAmount;
      debt.amount          = amount;
      debt.remainingAmount = Math.max(amount - paidSoFar, 0);
      if (debt.remainingAmount === 0) debt.status = 'settled';
    }

    await debt.save();
    res.json({ success: true, message: 'Cập nhật thành công', data: debt });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Lỗi khi cập nhật', error: err.message });
  }
};

// DELETE /api/debts/:id
export const deleteDebt = async (req, res) => {
  try {
    const deleted = await Debt.destroy({ where: { id: req.params.id, userId: req.user.id } });
    if (!deleted) return res.status(404).json({ success: false, message: 'Không tìm thấy khoản nợ' });
    res.json({ success: true, message: 'Đã xóa khoản nợ' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa', error: err.message });
  }
};

// POST /api/debts/:id/pay   — ghi nhận trả/thu một phần
export const addPayment = async (req, res) => {
  try {
    const { amount, note } = req.body;
    if (!amount || amount <= 0)
      return res.status(400).json({ success: false, message: 'Số tiền phải lớn hơn 0' });

    const debt = await Debt.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!debt) return res.status(404).json({ success: false, message: 'Không tìm thấy khoản nợ' });
    if (debt.status === 'settled')
      return res.status(400).json({ success: false, message: 'Khoản nợ đã tất toán' });

    const payAmount = Math.min(amount, parseFloat(debt.remainingAmount));
    const history = Array.isArray(debt.paymentHistory) ? debt.paymentHistory.slice() : [];
    history.push({ amount: payAmount, note: note || '', date: new Date() });
    debt.paymentHistory = history;
    debt.remainingAmount = parseFloat(debt.remainingAmount) - payAmount;
    if (debt.remainingAmount <= 0) {
      debt.remainingAmount = 0;
      debt.status = 'settled';
    }

    await debt.save();
    res.json({
      success: true,
      message: debt.status === 'settled' ? '✅ Đã tất toán khoản nợ!' : 'Ghi nhận thanh toán thành công',
      data: debt
    });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Lỗi khi ghi nhận thanh toán', error: err.message });
  }
};

// PATCH /api/debts/:id/settle  — đánh dấu tất toán thủ công
export const settleDebt = async (req, res) => {
  try {
    const debt = await Debt.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!debt) return res.status(404).json({ success: false, message: 'Không tìm thấy khoản nợ' });
    debt.status = 'settled';
    debt.remainingAmount = 0;
    await debt.save();
    res.json({ success: true, message: 'Đã đánh dấu tất toán', data: debt });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi', error: err.message });
  }
};
