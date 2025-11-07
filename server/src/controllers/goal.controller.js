import Goal from '../models/Goal.model.js';

// @desc    Get all goals
// @route   GET /api/goals
// @access  Private
export const getGoals = async (req, res) => {
  try {
    const { isAchieved } = req.query;
    const filter = { userId: req.user._id };
    
    if (isAchieved !== undefined) {
      filter.isAchieved = isAchieved === 'true';
    }

    const goals = await Goal.find(filter).sort({ deadline: 1, priority: -1 });

    res.status(200).json({
      success: true,
      count: goals.length,
      data: goals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách mục tiêu',
      error: error.message
    });
  }
};

// @desc    Get single goal
// @route   GET /api/goals/:id
// @access  Private
export const getGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mục tiêu'
      });
    }

    // Add calculated fields
    const goalData = goal.toObject();
    goalData.monthlySaving = goal.calculateMonthlySaving();

    res.status(200).json({
      success: true,
      data: goalData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin mục tiêu',
      error: error.message
    });
  }
};

// @desc    Create goal
// @route   POST /api/goals
// @access  Private
export const createGoal = async (req, res) => {
  try {
    const {
      name,
      description,
      targetAmount,
      currentAmount,
      deadline,
      priority,
      icon,
      color
    } = req.body;

    const goal = await Goal.create({
      userId: req.user._id,
      name,
      description,
      targetAmount,
      currentAmount: currentAmount || 0,
      deadline,
      priority: priority || 'medium',
      icon: icon || '🎯',
      color: color || '#3B82F6'
    });

    res.status(201).json({
      success: true,
      message: 'Tạo mục tiêu thành công',
      data: goal
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi tạo mục tiêu',
      error: error.message
    });
  }
};

// @desc    Update goal
// @route   PUT /api/goals/:id
// @access  Private
export const updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mục tiêu'
      });
    }

    const {
      name,
      description,
      targetAmount,
      deadline,
      priority,
      icon,
      color
    } = req.body;

    // Update fields
    if (name) goal.name = name;
    if (description !== undefined) goal.description = description;
    if (targetAmount !== undefined) goal.targetAmount = targetAmount;
    if (deadline) goal.deadline = deadline;
    if (priority) goal.priority = priority;
    if (icon) goal.icon = icon;
    if (color) goal.color = color;

    // Check if achieved after update
    if (goal.currentAmount >= goal.targetAmount && !goal.isAchieved) {
      goal.isAchieved = true;
      goal.achievedDate = new Date();
    }

    await goal.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật mục tiêu thành công',
      data: goal
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi cập nhật mục tiêu',
      error: error.message
    });
  }
};

// @desc    Delete goal
// @route   DELETE /api/goals/:id
// @access  Private
export const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mục tiêu'
      });
    }

    await goal.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa mục tiêu thành công'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi xóa mục tiêu',
      error: error.message
    });
  }
};

// @desc    Add amount to goal
// @route   POST /api/goals/:id/add-amount
// @access  Private
export const addAmountToGoal = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền phải lớn hơn 0'
      });
    }

    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mục tiêu'
      });
    }

    await goal.addAmount(amount);

    res.status(200).json({
      success: true,
      message: goal.isAchieved ? '🎉 Chúc mừng! Bạn đã đạt được mục tiêu!' : 'Thêm tiền thành công',
      data: goal
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi thêm tiền',
      error: error.message
    });
  }
};

// @desc    Get goal statistics
// @route   GET /api/goals/stats
// @access  Private
export const getGoalStats = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user._id });

    const totalGoals = goals.length;
    const achievedGoals = goals.filter(g => g.isAchieved).length;
    const activeGoals = goals.filter(g => !g.isAchieved).length;
    
    const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalCurrentAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalRemainingAmount = goals.reduce((sum, g) => sum + g.remainingAmount, 0);

    const overallProgress = totalTargetAmount > 0 
      ? parseFloat(((totalCurrentAmount / totalTargetAmount) * 100).toFixed(1))
      : 0;

    // Upcoming deadlines (next 30 days)
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const upcomingDeadlines = goals.filter(g => 
      !g.isAchieved && 
      new Date(g.deadline) >= now && 
      new Date(g.deadline) <= futureDate
    ).length;

    res.status(200).json({
      success: true,
      data: {
        totalGoals,
        achievedGoals,
        activeGoals,
        totalTargetAmount,
        totalCurrentAmount,
        totalRemainingAmount,
        overallProgress,
        upcomingDeadlines
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê',
      error: error.message
    });
  }
};
