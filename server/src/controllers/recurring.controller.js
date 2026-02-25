import RecurringTransaction from '../models/RecurringTransaction.model.js';
import Transaction from '../models/Transaction.model.js';

// @desc    Get all recurring transactions
// @route   GET /api/recurring
// @access  Private
export const getRecurringTransactions = async (req, res) => {
  try {
    const { isActive } = req.query;
    const filter = { userId: req.user._id };
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const recurring = await RecurringTransaction.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: recurring.length,
      data: recurring
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách giao dịch định kỳ',
      error: error.message
    });
  }
};

// @desc    Get single recurring transaction
// @route   GET /api/recurring/:id
// @access  Private
export const getRecurringTransaction = async (req, res) => {
  try {
    const recurring = await RecurringTransaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!recurring) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch định kỳ'
      });
    }

    res.status(200).json({
      success: true,
      data: recurring
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin giao dịch định kỳ',
      error: error.message
    });
  }
};

// @desc    Create recurring transaction
// @route   POST /api/recurring
// @access  Private
export const createRecurringTransaction = async (req, res) => {
  try {
    const {
      templateName,
      type,
      category,
      amount,
      note,
      frequency,
      startDate,
      endDate,
      occurrences,
      notifyBeforeExecution,
      notifyDays
    } = req.body;

    const recurring = await RecurringTransaction.create({
      userId: req.user._id,
      templateName,
      type,
      category,
      amount,
      note,
      frequency,
      startDate: startDate || Date.now(),
      endDate,
      occurrences,
      notifyBeforeExecution,
      notifyDays
    });

    // Calculate next execution
    recurring.nextExecution = recurring.calculateNextExecution();
    await recurring.save();

    res.status(201).json({
      success: true,
      message: 'Tạo giao dịch định kỳ thành công',
      data: recurring
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi tạo giao dịch định kỳ',
      error: error.message
    });
  }
};

// @desc    Update recurring transaction
// @route   PUT /api/recurring/:id
// @access  Private
export const updateRecurringTransaction = async (req, res) => {
  try {
    const recurring = await RecurringTransaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!recurring) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch định kỳ'
      });
    }

    const {
      templateName,
      amount,
      note,
      frequency,
      endDate,
      occurrences,
      isActive,
      notifyBeforeExecution,
      notifyDays
    } = req.body; // Lấy các trường có thể cập nhật

    // Update fields
    if (templateName) recurring.templateName = templateName;
    if (amount !== undefined) recurring.amount = amount;
    if (note !== undefined) recurring.note = note;
    if (frequency) recurring.frequency = frequency;
    if (endDate !== undefined) recurring.endDate = endDate;
    if (occurrences !== undefined) recurring.occurrences = occurrences;
    if (isActive !== undefined) recurring.isActive = isActive;
    if (notifyBeforeExecution !== undefined) recurring.notifyBeforeExecution = notifyBeforeExecution;
    if (notifyDays !== undefined) recurring.notifyDays = notifyDays;

    // Recalculate next execution if frequency changed
    if (frequency) {
      recurring.nextExecution = recurring.calculateNextExecution();
    }

    await recurring.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật giao dịch định kỳ thành công',
      data: recurring
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi cập nhật giao dịch định kỳ',
      error: error.message
    });
  }
};

// @desc    Delete recurring transaction
// @route   DELETE /api/recurring/:id
// @access  Private
export const deleteRecurringTransaction = async (req, res) => {
  try {
    const recurring = await RecurringTransaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!recurring) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch định kỳ'
      });
    }

    await recurring.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa giao dịch định kỳ thành công'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi xóa giao dịch định kỳ',
      error: error.message
    });
  }
};

// @desc    Execute recurring transaction manually
// @route   POST /api/recurring/:id/execute
// @access  Private
export const executeRecurringTransaction = async (req, res) => {
  try {
    const recurring = await RecurringTransaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!recurring) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch định kỳ'
      });
    }

    // Create transaction
    const transaction = await Transaction.create({
      userId: req.user._id,
      type: recurring.type,
      category: recurring.category,
      amount: recurring.amount,
      note: `${recurring.note || ''} (Tự động - ${recurring.templateName})`,
      date: new Date()
    });

    // Update recurring transaction
    recurring.executedCount += 1;
    recurring.lastExecuted = new Date();
    recurring.nextExecution = recurring.calculateNextExecution();

    // Check if should deactivate
    if (recurring.endDate && new Date() >= new Date(recurring.endDate)) {
      recurring.isActive = false;
    }
    if (recurring.occurrences && recurring.executedCount >= recurring.occurrences) {
      recurring.isActive = false;
    }

    await recurring.save();

    res.status(200).json({
      success: true,
      message: 'Thực hiện giao dịch định kỳ thành công',
      data: {
        recurring,
        transaction
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi thực hiện giao dịch định kỳ',
      error: error.message
    });
  }
};

// @desc    Execute all pending recurring transactions (for cron job)
// @route   POST /api/recurring/execute-pending
// @access  Private (should be protected by API key for cron)
export const executePendingRecurringTransactions = async (req, res) => {
  try {
    const now = new Date();

    const pendingRecurring = await RecurringTransaction.find({
      isActive: true,
      nextExecution: { $lte: now }
    });

    const toExecute = pendingRecurring.filter(r => r.shouldExecute());
    if (toExecute.length === 0) {
      return res.status(200).json({ success: true, message: 'Không có giao dịch cần thực hiện', data: [] });
    }

    // Batch insert all transactions at once
    const txDocs = toExecute.map(r => ({
      userId:   r.userId,
      type:     r.type,
      category: r.category,
      amount:   r.amount,
      note:     `${r.note || ''} (Tự động - ${r.templateName})`,
      date:     now
    }));
    const createdTx = await Transaction.insertMany(txDocs, { ordered: false });

    // Batch update all recurring documents
    const bulkOps = toExecute.map((r, i) => {
      const newCount  = r.executedCount + 1;
      const nextExec  = r.calculateNextExecution();
      const deactivate = (r.endDate && now >= new Date(r.endDate)) ||
                         (r.occurrences && newCount >= r.occurrences);
      return {
        updateOne: {
          filter: { _id: r._id },
          update: { $set: {
            executedCount:   newCount,
            lastExecuted:    now,
            nextExecution:   nextExec,
            ...(deactivate ? { isActive: false } : {})
          }}
        }
      };
    });
    await RecurringTransaction.bulkWrite(bulkOps);

    const results = toExecute.map((r, i) => ({
      recurringId:   r._id,
      transactionId: createdTx[i]?._id,
      success: true
    }));

    res.status(200).json({
      success: true,
      message: `Đã thực hiện ${results.length} giao dịch định kỳ`,
      data: results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi thực hiện giao dịch định kỳ', error: error.message });
  }
};

// @desc    Get upcoming recurring transactions
// @route   GET /api/recurring/upcoming
// @access  Private
export const getUpcomingRecurringTransactions = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));

    const upcoming = await RecurringTransaction.find({
      userId: req.user._id,
      isActive: true,
      nextExecution: { $gte: now, $lte: futureDate }
    }).sort({ nextExecution: 1 });

    res.status(200).json({
      success: true,
      count: upcoming.length,
      data: upcoming
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách giao dịch sắp tới',
      error: error.message
    });
  }
};
