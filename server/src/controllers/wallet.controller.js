import { Wallet, Transaction, Notification, sequelize } from '../models/sequelize/index.js';
import { Op } from 'sequelize';

// Helper function to recalculate wallet balance
const recalculateWalletBalance = async (walletId) => {
  const wallet = await Wallet.findByPk(walletId);
  if (!wallet) return;

  // 1. Incomes on this wallet
  const incomeSum = await Transaction.sum('amount', {
    where: { walletId, type: 'income' }
  }) || 0;

  // 2. Expenses on this wallet
  const expenseSum = await Transaction.sum('amount', {
    where: { walletId, type: 'expense' }
  }) || 0;

  // 3. Outgoing transfers from this wallet
  const outgoingTransferSum = await Transaction.sum('amount', {
    where: { walletId, type: 'transfer' }
  }) || 0;

  // 4. Incoming transfers to this wallet
  const incomingTransferSum = await Transaction.sum('amount', {
    where: { toWalletId: walletId, type: 'transfer' }
  }) || 0;

  // Final balance = initialBalance + incomes + incoming transfers - expenses - outgoing transfers
  wallet.balance = Number(wallet.initialBalance) + Number(incomeSum) + Number(incomingTransferSum) - Number(expenseSum) - Number(outgoingTransferSum);
  await wallet.save();
  return wallet.balance;
};

// @desc    Get all wallets
// @route   GET /api/wallets
// @access  Private
export const getWallets = async (req, res) => {
  try {
    const wallets = await Wallet.findAll({
      where: { userId: req.user.id },
      order: [['isDefault', 'DESC'], ['createdAt', 'ASC']]
    });

    res.json({
      success: true,
      count: wallets.length,
      data: wallets
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new wallet
// @route   POST /api/wallets
// @access  Private
export const createWallet = async (req, res) => {
  try {
    const { name, initialBalance = 0, icon, color, isDefault = false } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Tên ví không được để trống' });
    }

    const initBal = Number(initialBalance);
    if (Number.isNaN(initBal) || initBal < 0) {
      return res.status(400).json({ success: false, message: 'Số dư ban đầu không hợp lệ' });
    }

    // If marked as default, unset previous default wallets
    if (isDefault) {
      await Wallet.update({ isDefault: false }, { where: { userId: req.user.id } });
    }

    const wallet = await Wallet.create({
      userId: req.user.id,
      name: name.trim(),
      initialBalance: initBal,
      balance: initBal,
      icon: icon || '💼',
      color: color || '#3B82F6',
      isDefault: !!isDefault
    });

    res.status(201).json({
      success: true,
      message: 'Tạo ví thành công',
      data: wallet
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a wallet
// @route   PUT /api/wallets/:id
// @access  Private
export const updateWallet = async (req, res) => {
  try {
    const { name, initialBalance, icon, color, isDefault } = req.body;
    const wallet = await Wallet.findOne({ where: { id: req.params.id, userId: req.user.id } });

    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ví hoặc không có quyền chỉnh sửa' });
    }

    // Set default wallet logic
    if (isDefault !== undefined && isDefault === true && !wallet.isDefault) {
      await Wallet.update({ isDefault: false }, { where: { userId: req.user.id } });
      wallet.isDefault = true;
    } else if (isDefault !== undefined && isDefault === false && wallet.isDefault) {
      // Cannot unset default if it's the only default
      const countDefault = await Wallet.count({ where: { userId: req.user.id, isDefault: true } });
      if (countDefault <= 1) {
        return res.status(400).json({ success: false, message: 'Hệ thống cần ít nhất một ví mặc định' });
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

    res.json({
      success: true,
      message: 'Cập nhật ví thành công',
      data: wallet
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a wallet (migrates transactions to default wallet)
// @route   DELETE /api/wallets/:id
// @access  Private
export const deleteWallet = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const walletToDelete = await Wallet.findOne({
      where: { id: req.params.id, userId: req.user.id },
      transaction
    });

    if (!walletToDelete) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Không tìm thấy ví' });
    }

    // Get count of user wallets
    const walletCount = await Wallet.count({
      where: { userId: req.user.id },
      transaction
    });

    if (walletCount <= 1) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Bạn không thể xóa ví cuối cùng. Cần có ít nhất một ví hoạt động.' });
    }

    // Find fallback wallet (default wallet or another wallet)
    const fallbackWallet = await Wallet.findOne({
      where: {
        userId: req.user.id,
        id: { [Op.ne]: walletToDelete.id }
      },
      order: [['isDefault', 'DESC'], ['createdAt', 'ASC']],
      transaction
    });

    if (!fallbackWallet) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Không tìm thấy ví dự phòng để chuyển giao dịch' });
    }

    // Link transactions of walletToDelete to fallbackWallet
    console.log(`Migrating transactions from wallet ${walletToDelete.name} to fallback wallet ${fallbackWallet.name}...`);
    await Transaction.update(
      { walletId: fallbackWallet.id },
      { where: { walletId: walletToDelete.id }, transaction }
    );

    // Also link toWalletId for incoming transfers
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

    res.json({
      success: true,
      message: `Xóa ví thành công. Tất cả giao dịch đã được chuyển sang ví "${fallbackWallet.name}".`
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Transfer money between wallets
// @route   POST /api/wallets/transfer
// @access  Private
export const transferFunds = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { fromWalletId, toWalletId, amount, note, date } = req.body;

    if (!fromWalletId || !toWalletId || !amount) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin: Ví nguồn, ví nhận, số tiền' });
    }

    if (fromWalletId === toWalletId) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Ví nguồn và ví nhận phải khác nhau' });
    }

    const amt = Number(amount);
    if (Number.isNaN(amt) || amt <= 0) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Số tiền chuyển khoản không hợp lệ' });
    }

    // Verify wallets belong to user sequentially to avoid tedious connection locks on SQL Server
    const fromWallet = await Wallet.findOne({ where: { id: fromWalletId, userId: req.user.id }, transaction });
    const toWallet = await Wallet.findOne({ where: { id: toWalletId, userId: req.user.id }, transaction });

    if (!fromWallet || !toWallet) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Một hoặc cả hai ví không tồn tại hoặc không thuộc quyền sở hữu của bạn' });
    }

    // Verify sufficient balance in source wallet (optional, but highly recommended)
    if (Number(fromWallet.balance) < amt) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: `Số dư ví "${fromWallet.name}" không đủ để chuyển khoản (${fromWallet.balance.toLocaleString('vi-VN')} ₫)` });
    }

    // Create the transfer transaction record
    const transferTx = await Transaction.create({
      userId: req.user.id,
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

    // Save sequential updates to avoid concurrent transaction requests
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
      userId: req.user.id,
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

    res.status(201).json({
      success: true,
      message: 'Chuyển khoản thành công',
      data: transferTx
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};

export { recalculateWalletBalance };
