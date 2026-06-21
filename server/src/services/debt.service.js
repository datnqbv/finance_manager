import { Debt } from '../models/sequelize/index.js';
import ErrorResponse from '../utils/errorResponse.js';

/**
 * Get all debts for a user with optional filters and calculate stats
 */
export const getDebts = async (userId, query = {}) => {
  const { status, type } = query;
  const filter = { userId };
  
  if (status) filter.status = status;
  if (type)   filter.type   = type;

  const debts = await Debt.findAll({ 
    where: filter, 
    order: [['createdAt', 'DESC']] 
  });

  // Calculate statistics
  const all = await Debt.findAll({ where: { userId } });
  const stats = {
    totalLend:     all.filter(d => d.type === 'lend').reduce((s, d) => s + parseFloat(d.remainingAmount || 0), 0),
    totalBorrow:   all.filter(d => d.type === 'borrow').reduce((s, d) => s + parseFloat(d.remainingAmount || 0), 0),
    activeLend:    all.filter(d => d.type === 'lend'   && d.status === 'active').length,
    activeBorrow:  all.filter(d => d.type === 'borrow' && d.status === 'active').length,
  };

  return { debts, stats };
};

/**
 * Create a new debt record
 */
export const createDebt = async (userId, data) => {
  const { type, personName, amount, description, dueDate } = data;
  
  return await Debt.create({
    userId,
    type,
    personName,
    amount,
    remainingAmount: amount,
    description: description || '',
    dueDate: dueDate || null
  });
};

/**
 * Update an existing debt record
 */
export const updateDebt = async (userId, id, data) => {
  const debt = await Debt.findOne({ where: { id, userId } });
  if (!debt) {
    throw new ErrorResponse('Không tìm thấy khoản nợ', 404);
  }

  const { personName, amount, description, dueDate } = data;
  if (personName) debt.personName = personName;
  if (description !== undefined) debt.description = description;
  if (dueDate !== undefined) debt.dueDate = dueDate || null;
  
  if (amount && amount > 0) {
    // Recalculate remaining proportionally
    const paidSoFar = debt.amount - debt.remainingAmount;
    debt.amount = amount;
    debt.remainingAmount = Math.max(amount - paidSoFar, 0);
    if (debt.remainingAmount === 0) {
      debt.status = 'settled';
    }
  }

  await debt.save();
  return debt;
};

/**
 * Delete a debt record
 */
export const deleteDebt = async (userId, id) => {
  const deleted = await Debt.destroy({ where: { id, userId } });
  if (!deleted) {
    throw new ErrorResponse('Không tìm thấy khoản nợ', 404);
  }
  return true;
};

/**
 * Add a payment record (partial payment) to a debt
 */
export const addPayment = async (userId, id, data) => {
  const { amount, note } = data;
  
  if (!amount || amount <= 0) {
    throw new ErrorResponse('Số tiền phải lớn hơn 0', 400);
  }

  const debt = await Debt.findOne({ where: { id, userId } });
  if (!debt) {
    throw new ErrorResponse('Không tìm thấy khoản nợ', 404);
  }
  if (debt.status === 'settled') {
    throw new ErrorResponse('Khoản nợ đã tất toán', 400);
  }

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
  return debt;
};

/**
 * Mark a debt as settled manually
 */
export const settleDebt = async (userId, id) => {
  const debt = await Debt.findOne({ where: { id, userId } });
  if (!debt) {
    throw new ErrorResponse('Không tìm thấy khoản nợ', 404);
  }
  
  debt.status = 'settled';
  debt.remainingAmount = 0;
  await debt.save();
  return debt;
};
