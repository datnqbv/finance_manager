import { Goal } from '../models/sequelize/index.js';
import ErrorResponse from '../utils/errorResponse.js';

const formatGoalResponse = (goal) => {
  if (!goal) return null;
  const data = goal.get ? goal.get({ plain: true }) : goal;
  data.progressPercentage = goal.progressPercentage;
  data.remainingAmount = goal.remainingAmount;
  data.daysRemaining = goal.daysRemaining;
  data.monthlySaving = typeof goal.calculateMonthlySaving === 'function' ? goal.calculateMonthlySaving() : 0;
  data.dailySaving = goal.dailySaving;
  data.weeklySaving = goal.weeklySaving;
  return data;
};

/**
 * Get all goals for a user
 */
export const getGoals = async (userId, query = {}) => {
  const { isAchieved } = query;
  const filter = { userId };
  
  if (isAchieved !== undefined) {
    filter.isAchieved = isAchieved === 'true';
  }

  const goals = await Goal.findAll({ 
    where: filter, 
    order: [['deadline', 'ASC'], ['priority', 'DESC']] 
  });

  return goals.map(formatGoalResponse);
};

/**
 * Get a single goal by ID
 */
export const getGoal = async (userId, id) => {
  const goal = await Goal.findOne({ where: { id, userId } });
  if (!goal) {
    throw new ErrorResponse('Không tìm thấy mục tiêu', 404);
  }
  return formatGoalResponse(goal);
};

/**
 * Create a new saving goal
 */
export const createGoal = async (userId, data) => {
  const { name, description, targetAmount, currentAmount, deadline, priority, icon, color } = data;

  const goal = await Goal.create({
    userId,
    name,
    description,
    targetAmount,
    currentAmount: currentAmount || 0,
    deadline,
    priority: priority || 'medium',
    icon: icon || '🎯',
    color: color || '#3B82F6'
  });

  return formatGoalResponse(goal);
};

/**
 * Update an existing saving goal
 */
export const updateGoal = async (userId, id, data) => {
  const goal = await Goal.findOne({ where: { id, userId } });
  if (!goal) {
    throw new ErrorResponse('Không tìm thấy mục tiêu', 404);
  }

  const { name, description, targetAmount, deadline, priority, icon, color } = data;

  if (name) goal.name = name;
  if (description !== undefined) goal.description = description;
  if (targetAmount !== undefined) goal.targetAmount = targetAmount;
  if (deadline) goal.deadline = deadline;
  if (priority) goal.priority = priority;
  if (icon) goal.icon = icon;
  if (color) goal.color = color;

  let newlyAchieved = false;
  if (goal.currentAmount >= goal.targetAmount && !goal.isAchieved) {
    goal.isAchieved = true;
    goal.achievedDate = new Date();
    newlyAchieved = true;
  }

  await goal.save();

  return formatGoalResponse(goal);
};

/**
 * Delete a saving goal
 */
export const deleteGoal = async (userId, id) => {
  const goal = await Goal.findOne({ where: { id, userId } });
  if (!goal) {
    throw new ErrorResponse('Không tìm thấy mục tiêu', 404);
  }
  await goal.destroy();
  return true;
};

/**
 * Add savings amount to a goal
 */
export const addAmountToGoal = async (userId, id, data) => {
  const { amount, note } = data;
  if (!amount || amount <= 0) {
    throw new ErrorResponse('Số tiền phải lớn hơn 0', 400);
  }

  const goal = await Goal.findOne({ where: { id, userId } });
  if (!goal) {
    throw new ErrorResponse('Không tìm thấy mục tiêu', 404);
  }

  const wasAchieved = goal.isAchieved;
  await goal.addAmount(amount, note || '');

  return {
    isAchieved: goal.isAchieved,
    data: formatGoalResponse(goal)
  };
};

/**
 * Get goals summary statistics
 */
export const getGoalStats = async (userId) => {
  const goals = await Goal.findAll({ where: { userId }, raw: true });

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

  return {
    totalGoals,
    achievedGoals,
    activeGoals,
    totalTargetAmount,
    totalCurrentAmount,
    totalRemainingAmount,
    overallProgress,
    upcomingDeadlines
  };
};
