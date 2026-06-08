import { User } from '../models/sequelize/index.js';
import { Op } from 'sequelize';

// @desc    Get leaderboard
// @route   GET /api/gamification/leaderboard
// @access  Private
export const getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const topUsers = await User.findAll({
      attributes: ['id', 'name', 'avatar', 'level', 'experience', 'isVip'],
      order: [
        ['level', 'DESC'],
        ['experience', 'DESC']
      ],
      limit
    });

    const totalUsers = await User.count();
    
    let currentUserRank = null;
    if (req.user) {
      const currentLevel = req.user.level || 1;
      const currentExperience = req.user.experience || 0;
      
      const higherUsersCount = await User.count({
        where: {
          [Op.or]: [
            { level: { [Op.gt]: currentLevel } },
            {
              level: currentLevel,
              experience: { [Op.gt]: currentExperience }
            }
          ]
        }
      });
      
      currentUserRank = {
        rank: higherUsersCount + 1,
        level: currentLevel,
        experience: currentExperience,
        name: req.user.name,
        avatar: req.user.avatar,
        id: req.user.id,
        isVip: req.user.isVip,
        streakDays: req.user.streakDays || 0,
        todayExperience: req.user.todayExperience || 0
      };
    }

    res.status(200).json({
      success: true,
      data: topUsers,
      totalUsers,
      currentUserRank
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy bảng xếp hạng',
      error: error.message
    });
  }
};

