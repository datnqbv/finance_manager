import { Goal, User } from '../models/sequelize/index.js';
import { addExperience } from '../utils/gamification.js';
import { Op } from 'sequelize';

const formatGoalResponse = (goal) => {
  if (!goal) return null;
  const data = goal.get ? goal.get({ plain: true }) : goal;
  data.progressPercentage = goal.progressPercentage;
  data.remainingAmount = goal.remainingAmount;
  data.daysRemaining = goal.daysRemaining;
  data.monthlySaving = goal.calculateMonthlySaving();
  data.dailySaving = goal.dailySaving;
  data.weeklySaving = goal.weeklySaving;
  return data;
};

// @desc    Get all goals
// @route   GET /api/goals
// @access  Private
export const getGoals = async (req, res) => {
  try {
    const { isAchieved } = req.query;
    const filter = { userId: req.user.id };
    
    if (isAchieved !== undefined) {
      filter.isAchieved = isAchieved === 'true';
    }

    const goals = await Goal.findAll({ where: filter, order: [['deadline','ASC'], ['priority','DESC']] });

    const goalsData = goals.map(formatGoalResponse);

    res.status(200).json({
      success: true,
      count: goalsData.length,
      data: goalsData
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
    const goal = await Goal.findOne({ where: { id: req.params.id, userId: req.user.id } });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mục tiêu'
      });
    }

    res.status(200).json({
      success: true,
      data: formatGoalResponse(goal)
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
      userId: req.user.id,
      name,
      description,
      targetAmount,
      currentAmount: currentAmount || 0,
      deadline,
      priority: priority || 'medium',
      icon: icon || '🎯',
      color: color || '#3B82F6'
    });

    // Gamification: Reward XP for creating a goal
    const userInstance = await User.findByPk(req.user.id);
    if (userInstance) {
      await addExperience(userInstance, 15);
    }

    res.status(201).json({
      success: true,
      message: 'Tạo mục tiêu thành công',
      data: formatGoalResponse(goal)
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
    const goal = await Goal.findOne({ where: { id: req.params.id, userId: req.user.id } });

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

    let newlyAchieved = false;
    // Check if achieved after update
    if (goal.currentAmount >= goal.targetAmount && !goal.isAchieved) {
      goal.isAchieved = true;
      goal.achievedDate = new Date();
      newlyAchieved = true;
    }

    await goal.save();

    // Gamification: Reward XP for completing a goal
    if (newlyAchieved) {
      const userInstance = await User.findByPk(req.user.id);
      if (userInstance) await addExperience(userInstance, 50);
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật mục tiêu thành công',
      data: formatGoalResponse(goal)
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
    const goal = await Goal.findOne({ where: { id: req.params.id, userId: req.user.id } });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mục tiêu'
      });
    }

    await goal.destroy();

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
    const { amount, note } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền phải lớn hơn 0'
      });
    }

    const goal = await Goal.findOne({ where: { id: req.params.id, userId: req.user.id } });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mục tiêu'
      });
    }

    const wasAchieved = goal.isAchieved;
    await goal.addAmount(amount, note || '');

    // Gamification: Reward XP for completing a goal
    if (!wasAchieved && goal.isAchieved) {
      const userInstance = await User.findByPk(req.user.id);
      if (userInstance) await addExperience(userInstance, 50);
    }

    res.status(200).json({
      success: true,
      message: goal.isAchieved ? '🎉 Chúc mừng! Bạn đã đạt được mục tiêu!' : 'Thêm tiền thành công',
      data: formatGoalResponse(goal)
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
    const goals = await Goal.findAll({ where: { userId: req.user.id }, raw: true });

    const totalGoals = goals.length;
    const achievedGoals = goals.filter(g => g.isAchieved).length;
    const activeGoals = goals.filter(g => !g.isAchieved).length;
    
    const totalTargetAmount = goals.reduce((sum, g) => sum + parseFloat(g.targetAmount || 0), 0);
    const totalCurrentAmount = goals.reduce((sum, g) => sum + parseFloat(g.currentAmount || 0), 0);
    const totalRemainingAmount = goals.reduce((sum, g) => sum + Math.max(parseFloat(g.targetAmount || 0) - parseFloat(g.currentAmount || 0), 0), 0);

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
