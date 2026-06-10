import User from '../models/sequelize/User.js';

/**
 * Adds experience points to a user and handles leveling up.
 * @param {Object} user - The Sequelize user instance.
 * @param {number} xpAmount - The amount of XP to add.
 * @returns {Promise<{xpAdded: number, newLevel: number, newExperience: number, leveledUp: boolean}>}
 */
export const addExperience = async (user, xpAmount) => {
  try {
    if (!user) return null;

    user.experience += xpAmount;
    
    // Streak & Daily XP Logic
    const tzOffset = new Date().getTimezoneOffset() * 60000;
    const todayStr = (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];
    
    if (user.lastActiveDate !== todayStr) {
      if (user.lastActiveDate) {
        const todayDateOnly = new Date(todayStr);
        const lastActive = new Date(user.lastActiveDate);
        const diffTime = Math.abs(todayDateOnly - lastActive);
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays === 1) {
          user.streakDays = (user.streakDays || 0) + 1;
        } else if (diffDays > 1) {
          user.streakDays = 1;
        }
      } else {
        user.streakDays = 1;
      }
      user.todayExperience = xpAmount;
      user.lastActiveDate = todayStr;
    } else {
      user.todayExperience = (user.todayExperience || 0) + xpAmount;
    }

    let leveledUp = false;

    // Calculate required XP for next level (e.g., Level 1 -> 100 XP, Level 2 -> 200 XP)
    let requiredXp = user.level * 100;

    while (user.experience >= requiredXp) {
      user.experience -= requiredXp;
      user.level += 1;
      leveledUp = true;
      requiredXp = user.level * 100; // Recalculate for potential multi-level ups
    }

    await user.save({ validateBeforeSave: false });

    return {
      xpAdded: xpAmount,
      newLevel: user.level,
      newExperience: user.experience,
      leveledUp
    };
  } catch (error) {
    console.error('Error adding experience:', error);
    return null;
  }
};
