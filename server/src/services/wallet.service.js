import { Wallet, Transaction, Notification, sequelize } from '../models/sequelize/index.js';
import { Op } from 'sequelize';
import ErrorResponse from '../utils/errorResponse.js';

/**
 * Helper function to recalculate wallet balance
 */
export const recalculateWalletBalance = async (walletId, options = {}) => {
  const { transaction } = options;
  const wallet = await Wallet.findByPk(walletId, { transaction });
  if (!wallet) return 0;

  // Chỉ tính giao dịch gốc (parentId = null), bỏ qua giao dịch con tách
  // 1. Incomes on this wallet
  const incomeSum = await Transaction.sum('amount', {
    where: { walletId, type: 'income', parentId: null },
    transaction
  }) || 0;

  // 2. Expenses on this wallet
  const expenseSum = await Transaction.sum('amount', {
    where: { walletId, type: 'expense', parentId: null },
    transaction
  }) || 0;

  // 3. Outgoing transfers from this wallet
  const outgoingTransferSum = await Transaction.sum('amount', {
    where: { walletId, type: 'transfer', parentId: null },
    transaction
  }) || 0;

  // 4. Incoming transfers to this wallet
  const incomingTransferSum = await Transaction.sum('amount', {
    where: { toWalletId: walletId, type: 'transfer', parentId: null },
    transaction
  }) || 0;

  // Final balance = initialBalance + incomes + incoming transfers - expenses - outgoing transfers
  wallet.balance = Number(wallet.initialBalance) + Number(incomeSum) + Number(incomingTransferSum) - Number(expenseSum) - Number(outgoingTransferSum);
  await wallet.save({ transaction });
  return wallet.balance;
};

/**
 * Get all wallets for a user
 */
export const getWallets = async (userId) => {
  return await Wallet.findAll({
    where: { userId },
    order: [['isDefault', 'DESC'], ['createdAt', 'ASC']]
  });
};

/**
 * Create a new wallet
 */
export const createWallet = async (userId, data) => {
  const { name, initialBalance = 0, icon, color, isDefault = false } = data;

  if (!name || name.trim() === '') {
    throw new ErrorResponse('Tên ví không được để trống', 400);
  }

  const initBal = Number(initialBalance);
  if (Number.isNaN(initBal) || initBal < 0) {
    throw new ErrorResponse('Số dư ban đầu không hợp lệ', 400);
  }

  // If marked as default, unset previous default wallets
  if (isDefault) {
    await Wallet.update({ isDefault: false }, { where: { userId } });
  }

  return await Wallet.create({
    userId,
    name: name.trim(),
    initialBalance: initBal,
    balance: initBal,
    icon: icon || '💼',
    color: color || '#3B82F6',
    isDefault: !!isDefault
  });
};

/**
 * Update an existing wallet
 */
export const updateWallet = async (userId, id, data) => {
  const { name, initialBalance, icon, color, isDefault } = data;
  const wallet = await Wallet.findOne({ where: { id, userId } });

  if (!wallet) {
    throw new ErrorResponse('Không tìm thấy ví hoặc không có quyền chỉnh sửa', 404);
  }

  // Set default wallet logic
  if (isDefault !== undefined && isDefault === true && !wallet.isDefault) {
    await Wallet.update({ isDefault: false }, { where: { userId } });
    wallet.isDefault = true;
  } else if (isDefault !== undefined && isDefault === false && wallet.isDefault) {
    // Cannot unset default if it's the only default
    const countDefault = await Wallet.count({ where: { userId, isDefault: true } });
    if (countDefault <= 1) {
      throw new ErrorResponse('Hệ thống cần ít nhất một ví mặc định', 400);
    }
    wallet.isDefault = false;
  }

  if (name) wallet.name = name.trim();
  if (icon) wallet.icon = icon;
  if (color) wallet.color = color;

  // Recalculate balance if initialBalance changes
  if (initialBalance !== undefined) {
    const newInitBal = Number(initialBalance);
    if (!Number.isNaN(newInitBal) && newInitBal >= 0) {
      const diff = newInitBal - Number(wallet.initialBalance);
      wallet.initialBalance = newInitBal;
      wallet.balance = Number(wallet.balance) + diff;
    }
  }

  await wallet.save();
  return wallet;
};

/**
 * Delete a wallet (migrates transactions to fallback wallet)
 */
export const deleteWallet = async (userId, id) => {
  const transaction = await sequelize.transaction();
  try {
    const walletToDelete = await Wallet.findOne({
      where: { id, userId },
      transaction
    });

    if (!walletToDelete) {
      throw new ErrorResponse('Không tìm thấy ví', 404);
    }

    // Get count of user wallets
    const walletCount = await Wallet.count({
      where: { userId },
      transaction
    });

    if (walletCount <= 1) {
      throw new ErrorResponse('Bạn không thể xóa ví cuối cùng. Cần có ít nhất một ví hoạt động.', 400);
    }

    // Find fallback wallet (default wallet or another wallet)
    const fallbackWallet = await Wallet.findOne({
      where: {
        userId,
        id: { [Op.ne]: walletToDelete.id }
      },
      order: [['isDefault', 'DESC'], ['createdAt', 'ASC']],
      transaction
    });

    if (!fallbackWallet) {
      throw new ErrorResponse('Không tìm thấy ví dự phòng để chuyển giao dịch', 400);
    }

    // Link transactions of walletToDelete to fallbackWallet
    await Transaction.update(
      { walletId: fallbackWallet.id },
      { where: { walletId: walletToDelete.id }, transaction }
    );

    // Link toWalletId for incoming transfers
    await Transaction.update(
      { toWalletId: fallbackWallet.id },
      { where: { toWalletId: walletToDelete.id }, transaction }
    );

    // If we deleted the default wallet, make fallbackWallet default
    if (walletToDelete.isDefault) {
      fallbackWallet.isDefault = true;
      await fallbackWallet.save({ transaction });
    }

    // Delete the wallet
    await walletToDelete.destroy({ transaction });

    await transaction.commit();

    // Recalculate balance for fallbackWallet (outside transaction to avoid lock waits)
    await recalculateWalletBalance(fallbackWallet.id);
    return fallbackWallet;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Transfer funds between wallets
 */
export const transferFunds = async (userId, data) => {
  const transaction = await sequelize.transaction();
  try {
    const { fromWalletId, toWalletId, amount, note, date } = data;

    if (!fromWalletId || !toWalletId || !amount) {
      throw new ErrorResponse('Vui lòng cung cấp đầy đủ thông tin: Ví nguồn, ví nhận, số tiền', 400);
    }

    if (fromWalletId === toWalletId) {
      throw new ErrorResponse('Ví nguồn và ví nhận phải khác nhau', 400);
    }

    const amt = Number(amount);
    if (Number.isNaN(amt) || amt <= 0) {
      throw new ErrorResponse('Số tiền chuyển khoản không hợp lệ', 400);
    }

    const fromWallet = await Wallet.findOne({ where: { id: fromWalletId, userId }, transaction });
    const toWallet = await Wallet.findOne({ where: { id: toWalletId, userId }, transaction });

    if (!fromWallet || !toWallet) {
      throw new ErrorResponse('Một hoặc cả hai ví không tồn tại hoặc không thuộc quyền sở hữu của bạn', 404);
    }

    if (Number(fromWallet.balance) < amt) {
      throw new ErrorResponse(`Số dư ví "${fromWallet.name}" không đủ để chuyển khoản (${fromWallet.balance.toLocaleString('vi-VN')} ₫)`, 400);
    }

    // Create the transfer transaction record
    const transferTx = await Transaction.create({
      userId,
      type: 'transfer',
      category: 'Chuyển khoản',
      amount: amt,
      note: note || `Chuyển khoản từ ví ${fromWallet.name} sang ví ${toWallet.name}`,
      date: date || new Date(),
      walletId: fromWalletId,
      toWalletId: toWalletId
    }, { transaction });

    // Update balances
    fromWallet.balance = Number(fromWallet.balance) - amt;
    toWallet.balance = Number(toWallet.balance) + amt;

    await fromWallet.save({ transaction });
    await toWallet.save({ transaction });

    // Create notification for transfer
    const transactionDate = new Date();
    const formattedDate = transactionDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const formattedTime = transactionDate.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const notificationMessage = `Vào lúc ${formattedTime} ngày ${formattedDate}, bạn đã chuyển khoản ${amt.toLocaleString('vi-VN')} ₫ từ ví "${fromWallet.name}" sang ví "${toWallet.name}"${note ? ` - ${note}` : ''}`;

    await Notification.create({
      userId,
      type: 'transaction',
      title: '⇆ Chuyển khoản ví',
      message: notificationMessage,
      relatedId: transferTx.id,
      relatedModel: 'Transaction',
      read: false,
      metadata: {
        transactionType: 'transfer',
        category: 'Chuyển khoản',
        amount: amt,
        date: transferTx.date
      }
    }, { transaction });

    await transaction.commit();
    return transferTx;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
