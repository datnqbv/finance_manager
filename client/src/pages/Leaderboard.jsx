import React, { useState, useEffect } from 'react';
import { gamificationService } from '../services/gamificationService';
import { useLanguage } from '../context/LanguageContext';
import { FiAward, FiTrendingUp, FiStar, FiUsers, FiTarget, FiInfo, FiCheck, FiPlus, FiLogIn, FiArrowUp } from 'react-icons/fi';
import { FaCrown, FaFire, FaMedal } from 'react-icons/fa';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';

const Leaderboard = () => {
  const { language } = useLanguage();
  const isEnglish = language === 'en';
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await gamificationService.getLeaderboard(10);
        if (response.success) {
          setUsers(response.data || []);
          setTotalUsers(response.totalUsers || 0);
          setCurrentUserRank(response.currentUserRank || null);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const listUsers = users.slice(3);

  // Helper for gamification titles
  const getLevelTitle = (lvl) => {
    if (lvl <= 2) {
      return { 
        name: isEnglish ? 'Novice Saver' : 'Tân thủ tiết kiệm', 
        color: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
      };
    }
    if (lvl <= 5) {
      return { 
        name: isEnglish ? 'Saving Scholar' : 'Học giả tích lũy', 
        color: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
      };
    }
    if (lvl <= 9) {
      return { 
        name: isEnglish ? 'Expense Warrior' : 'Chiến thần chi tiêu', 
        color: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
      };
    }
    if (lvl <= 14) {
      return { 
        name: isEnglish ? 'Finance Wizard' : 'Bậc thầy tài chính', 
        color: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
      };
    }
    return { 
      name: isEnglish ? 'Asset Legend' : 'Huyền thoại tài sản', 
      color: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-400 border border-amber-500/40 shadow-sm shadow-amber-500/5 font-extrabold animate-pulse' 
    };
  };

  // 3D Podium floating particles decoration
  const FloatingParticles = () => {
    const particles = ['🌟', '✨', '👑', '💰', '✨', '💎'];
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {particles.map((char, idx) => (
          <motion.div
            key={idx}
            className="absolute text-lg"
            initial={{ 
              x: `${15 + idx * 15}%`, 
              y: '110%', 
              opacity: 0, 
              scale: 0.5 
            }}
            animate={{ 
              y: '-20%', 
              opacity: [0, 1, 1, 0], 
              scale: [0.5, 1.3, 1, 0.6] 
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: idx * 0.7,
              ease: "easeOut"
            }}
          >
            {char}
          </motion.div>
        ))}
      </div>
    );
  };

  // scoring guide action cards data
  const guideItems = [
    {
      icon: FiLogIn,
      xp: 10,
      title: isEnglish ? 'Daily Login' : 'Đăng nhập ngày',
      desc: isEnglish ? 'Check in daily' : 'Đăng nhập tích lũy chuỗi',
      bgColor: 'bg-violet-500/10 dark:bg-violet-500/20',
      color: 'text-violet-600 dark:text-violet-400'
    },
    {
      icon: FiPlus,
      xp: 5,
      title: isEnglish ? 'Add Transaction' : 'Ghi chép giao dịch',
      desc: isEnglish ? 'Record daily' : 'Tạo thói quen ghi chi tiêu',
      bgColor: 'bg-blue-500/10 dark:bg-blue-500/20',
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: FiTarget,
      xp: 15,
      title: isEnglish ? 'Create Goal' : 'Lập mục tiêu mới',
      desc: isEnglish ? 'Define savings milestone' : 'Hoạch định tài chính tương lai',
      bgColor: 'bg-amber-500/10 dark:bg-amber-500/20',
      color: 'text-amber-600 dark:text-amber-400'
    },
    {
      icon: FiCheck,
      xp: 50,
      title: isEnglish ? 'Complete Goal' : 'Đạt mục tiêu',
      desc: isEnglish ? 'Unlock savings milestones' : 'Tích lũy tài chính thành công',
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      color: 'text-emerald-600 dark:text-emerald-400'
    }
  ];

  if (loading) {
    return (
      <PageTransition>
        <div className="flex flex-col justify-center items-center h-80 gap-3">
          <div className="relative flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            <FiAward className="absolute text-emerald-500 text-lg animate-bounce" />
          </div>
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            {isEnglish ? 'Loading leaderboard...' : 'Đang tải bảng xếp hạng...'}
          </span>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-5">
        
        {/* Upper Layout: Leaderboard Hero Banner + Daily Goal Progress */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12 items-stretch">
          
          {/* Main Dark Green Hero Banner (Col Span 8) */}
          <div className="xl:col-span-8 rounded-xl bg-[#004b38] p-6 text-white shadow-[0_14px_40px_rgba(1,56,42,0.28)] relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-8 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full bg-[#4c8f7a] opacity-35" />
            
            <div className="relative">
              <div className="flex items-center gap-2">
                <FiAward size={18} className="text-[#b8e4d6]" />
                <p className="text-xs uppercase tracking-[0.18em] text-[#9ed3c3]">
                  {isEnglish ? 'Financial Leaderboard' : 'Bảng xếp hạng tài chính'}
                </p>
              </div>
              
              <h1 className="mt-3 text-5xl font-black tracking-tight">
                {currentUserRank ? `#${currentUserRank.rank}` : 'N/A'}
              </h1>
              
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-[#d8fff2]">
                {isEnglish ? 'Current standing' : 'Hạng hiện tại của bạn'}
              </div>
              
              {currentUserRank && (
                <div className="mt-4 max-w-xl">
                  <p className="text-sm text-[#d4efe7] leading-relaxed">
                    {isEnglish 
                      ? `Great job ${currentUserRank.name}! You are currently Level ${currentUserRank.level} (${getLevelTitle(currentUserRank.level).name}). Keep saving to climb higher!` 
                      : `Chào ${currentUserRank.name}! Bạn hiện đang đạt Cấp ${currentUserRank.level} (${getLevelTitle(currentUserRank.level).name}). Tiếp tục tích lũy để thăng hạng nhé!`}
                  </p>
                  
                  {/* Glassmorphic progress bar */}
                  <div className="mt-4 max-w-md bg-white/10 p-2.5 rounded-xl border border-white/10 backdrop-blur-sm">
                    <div className="flex justify-between items-center text-[10px] font-bold text-[#b8e4d6] uppercase tracking-wider mb-1.5">
                      <span>{isEnglish ? 'Level Progress' : 'Tiến trình Cấp'}</span>
                      <span>{currentUserRank.experience} / {currentUserRank.level * 100} XP</span>
                    </div>
                    <div className="w-full bg-[#003d2d] h-2 rounded-full overflow-hidden relative">
                      <div 
                        className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full transition-all duration-500 relative" 
                        style={{ width: `${Math.min(100, (currentUserRank.experience / (currentUserRank.level * 100)) * 100)}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full -translate-x-full animate-shimmer" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom aggregate stat counters */}
            <div className="relative mt-8 grid grid-cols-3 gap-4 border-t border-[#1e6b57] pt-5 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#9ed3c3]">{isEnglish ? 'Members' : 'Thành viên'}</p>
                <p className="mt-1 text-2xl font-bold">{totalUsers}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#9ed3c3]">{isEnglish ? 'Top Level' : 'Đỉnh cấp'}</p>
                <p className="mt-1 text-2xl font-bold">{users[0]?.level || 1}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#9ed3c3]">{isEnglish ? 'Today XP' : 'XP hôm nay'}</p>
                <p className="mt-1 text-2xl font-bold">{currentUserRank?.todayExperience || 0} XP</p>
              </div>
            </div>
          </div>

          {/* Sidebar daily streak widget (Col Span 4) */}
          {currentUserRank && (
            <div className="xl:col-span-4 rounded-xl bg-white p-5 shadow-sm dark:bg-[#191d25] border border-gray-100 dark:border-[#2b313d] flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[#181c24] dark:text-[#eef1f5] mb-4 text-base flex items-center gap-2">
                  <FiTarget className="text-orange-500" />
                  {isEnglish ? 'Daily XP Goal' : 'Mục tiêu hàng ngày'}
                </h3>
                
                {/* Circular SVG Progress */}
                <div className="flex justify-center mb-4">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <defs>
                        <linearGradient id="fireGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f97316" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                      <circle cx="50" cy="50" r="44" fill="none" className="stroke-gray-100 dark:stroke-gray-800" strokeWidth="8" />
                      <motion.circle 
                        cx="50" cy="50" r="44" fill="none" 
                        stroke="url(#fireGradient)"
                        strokeWidth="8" strokeLinecap="round" 
                        strokeDasharray="276" 
                        initial={{ strokeDashoffset: 276 }}
                        animate={{ strokeDashoffset: 276 - (Math.min(100, ((currentUserRank.todayExperience || 0) / 50) * 100) / 100) * 276 }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-orange-500 to-red-500">
                        {currentUserRank.todayExperience || 0}
                      </span>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">/ 50 XP</span>
                    </div>
                  </div>
                </div>

                <div className="text-center mb-4">
                  {currentUserRank.todayExperience >= 50 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full text-[10px] font-bold border border-orange-500/20">
                      🎉 {isEnglish ? 'Goal Achieved!' : 'Mục tiêu hoàn thành!'}
                    </span>
                  ) : (
                    <span className="text-[10.5px] font-bold text-gray-500 dark:text-gray-400">
                      {isEnglish 
                        ? `Need ${50 - currentUserRank.todayExperience} XP today` 
                        : `Cần thêm ${50 - currentUserRank.todayExperience} XP nữa`}
                    </span>
                  )}
                </div>

                {/* Streak details */}
                <div className="flex justify-between items-center text-xs font-bold text-gray-700 dark:text-gray-300 border-t border-gray-100 dark:border-gray-800 pt-3 pb-2">
                  <span>{isEnglish ? 'Active Streak' : 'Chuỗi đăng nhập'}</span>
                  <span className="flex items-center gap-1 text-orange-550 font-bold bg-orange-500/10 px-2 py-0.5 rounded-lg border border-orange-500/15">
                    <FaFire className="animate-pulse" />
                    {currentUserRank.streakDays || 0} {isEnglish ? 'Days' : 'Ngày'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center px-1">
                  {['Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'CN'].map((day, idx) => {
                    const streakCount = currentUserRank.streakDays || 0;
                    const isLit = streakCount >= (7 - idx);
                    return (
                      <div key={idx} className="flex flex-col items-center gap-1.5">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs border transition-all ${
                          isLit 
                            ? 'bg-gradient-to-tr from-orange-400 to-red-500 border-orange-500 text-white shadow-sm' 
                            : 'bg-transparent border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600'
                        }`}>
                          {isLit ? <FaFire size={11} /> : day.charAt(0)}
                        </div>
                        <span className="text-[8.5px] text-gray-400 font-bold">
                          {isEnglish ? ['M','T','W','T','F','S','S'][idx] : day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lower Layout: Top Podium, Full Ranks list, and Action guide */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-8 space-y-5">
            {/* Top 3 Podium Card */}
            {users.length > 0 && (
              <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-[#191d25] border border-gray-100 dark:border-[#2b313d] relative overflow-hidden">
                <FloatingParticles />
                
                <div className="border-b border-[#eceff4] dark:border-[#2b313d] pb-3 mb-5">
                  <h3 className="text-xl font-bold text-[#181c24] dark:text-[#eef1f5] flex items-center gap-2">
                    <FaCrown className="text-yellow-500 animate-pulse" />
                    {isEnglish ? 'Top Performers' : 'Top 3 cao thủ tài chính'}
                  </h3>
                </div>

                <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-6 items-end justify-center pt-8 pb-3 max-w-md mx-auto">
                  {/* Rank 2 (Silver) */}
                  {users[1] ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 100, delay: 0.1 }}
                      className="flex flex-col items-center group cursor-pointer"
                    >
                      <div className="relative mb-3 flex flex-col items-center w-full">
                        <div className="relative transition-transform duration-350 group-hover:scale-105">
                          {users[1].avatar ? (
                            <img src={users[1].avatar} alt={users[1].name} className="w-14 h-14 sm:w-18 sm:h-18 rounded-xl object-cover border-2 border-slate-300 dark:border-slate-500 shadow-md" />
                          ) : (
                            <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-805 dark:to-slate-700 text-slate-600 dark:text-slate-400 font-black text-lg flex items-center justify-center border-2 border-slate-300 dark:border-slate-500 shadow-md">
                              {users[1].name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="absolute -top-3 left-0 right-0 mx-auto w-7 h-7 bg-slate-400 text-white rounded-full border border-white dark:border-gray-800 shadow flex items-center justify-center z-10">
                            <FaMedal size={13} />
                          </div>
                        </div>
                        
                        <h3 className="mt-3 font-bold text-gray-800 dark:text-gray-200 text-xs sm:text-sm text-center truncate w-full px-1">
                          {users[1].name}
                        </h3>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full mt-1 border border-slate-200 dark:border-slate-700">
                          Lvl {users[1].level || 1}
                        </span>
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 mt-0.5">
                          {users[1].experience || 0} XP
                        </span>
                      </div>
                      
                      <div className="w-full bg-gradient-to-b from-slate-200 to-slate-300/40 dark:from-slate-800/80 dark:to-slate-900/30 rounded-t-xl h-20 flex flex-col items-center justify-center border-t border-slate-300 dark:border-slate-600 shadow-lg relative">
                        <span className="text-2xl sm:text-3xl font-black text-slate-400 dark:text-slate-500">2</span>
                        <span className="text-[8.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{isEnglish ? 'Silver' : 'Bạc'}</span>
                      </div>
                    </motion.div>
                  ) : <div />}

                  {/* Rank 1 (Gold) */}
                  {users[0] ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 100 }}
                      className="flex flex-col items-center z-10 group cursor-pointer"
                    >
                      <div className="relative mb-3 flex flex-col items-center w-full">
                        <div className="relative scale-110 transition-transform duration-350 group-hover:scale-115">
                          {users[0].avatar ? (
                            <img src={users[0].avatar} alt={users[0].name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border-4 border-yellow-400 dark:border-yellow-500 shadow-xl" />
                          ) : (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-tr from-yellow-105 to-yellow-200 dark:from-yellow-950/20 dark:to-yellow-900/20 text-yellow-600 dark:text-yellow-400 font-black text-2xl flex items-center justify-center border-4 border-yellow-400 dark:border-yellow-500 shadow-xl">
                              {users[0].name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="absolute -top-6 left-0 right-0 mx-auto w-fit text-yellow-500 animate-bounce z-10">
                            <FaCrown size={22} className="drop-shadow filter saturate-150" />
                          </div>
                        </div>
                        
                        <h3 className="mt-4 font-black text-gray-900 dark:text-white text-sm sm:text-base text-center truncate w-full px-1">
                          {users[0].name}
                        </h3>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 rounded-full mt-1 border border-yellow-200 dark:border-yellow-900/40">
                          Lvl {users[0].level || 1}
                        </span>
                        <span className="text-xs font-black text-yellow-600 dark:text-yellow-500 mt-0.5">
                          {users[0].experience || 0} XP
                        </span>
                      </div>
                      
                      <div className="w-full bg-gradient-to-b from-yellow-200/70 to-yellow-300/30 dark:from-yellow-950/50 dark:to-yellow-950/10 rounded-t-xl h-28 flex flex-col items-center justify-center border-t-2 border-yellow-400 dark:border-yellow-500 shadow-xl relative">
                        <span className="text-3xl sm:text-4xl font-black text-yellow-600 dark:text-yellow-500 drop-shadow">1</span>
                        <span className="text-[9.5px] font-black text-yellow-650 dark:text-yellow-500 uppercase tracking-widest">{isEnglish ? 'Gold' : 'Vàng'}</span>
                      </div>
                    </motion.div>
                  ) : <div />}

                  {/* Rank 3 (Bronze) */}
                  {users[2] ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 100, delay: 0.2 }}
                      className="flex flex-col items-center group cursor-pointer"
                    >
                      <div className="relative mb-3 flex flex-col items-center w-full">
                        <div className="relative transition-transform duration-350 group-hover:scale-105">
                          {users[2].avatar ? (
                            <img src={users[2].avatar} alt={users[2].name} className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover border-2 border-amber-600 dark:border-amber-700 shadow-md" />
                          ) : (
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-tr from-amber-50 to-amber-100 dark:from-amber-950/10 dark:to-amber-900/10 text-amber-700 dark:text-amber-500 font-black text-base flex items-center justify-center border-2 border-amber-600 dark:border-amber-700 shadow-md">
                              {users[2].name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="absolute -top-3 left-0 right-0 mx-auto w-7 h-7 bg-amber-600 text-white rounded-full border border-white dark:border-gray-800 shadow flex items-center justify-center z-10">
                            <FaMedal size={12} />
                          </div>
                        </div>
                        
                        <h3 className="mt-3 font-bold text-gray-800 dark:text-gray-200 text-xs sm:text-sm text-center truncate w-full px-1">
                          {users[2].name}
                        </h3>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-full mt-1 border border-amber-100 dark:border-amber-900/30">
                          Lvl {users[2].level || 1}
                        </span>
                        <span className="text-[10px] font-black text-amber-650 dark:text-amber-500 mt-0.5">
                          {users[2].experience || 0} XP
                        </span>
                      </div>
                      
                      <div className="w-full bg-gradient-to-b from-amber-100/50 to-amber-200/20 dark:from-amber-950/30 dark:to-amber-950/10 rounded-t-xl h-14 flex flex-col items-center justify-center border-t border-amber-500/50 dark:border-amber-800 shadow-md relative">
                        <span className="text-xl sm:text-2xl font-black text-amber-650 dark:text-amber-700">3</span>
                        <span className="text-[8.5px] font-bold text-amber-600 dark:text-amber-700 uppercase tracking-widest">{isEnglish ? 'Bronze' : 'Đồng'}</span>
                      </div>
                    </motion.div>
                  ) : <div />}
                </div>
              </div>
            )}


            {/* Standings List Card (Rank 4-10) */}
            {users.length > 3 && (
              <div className="rounded-xl bg-white shadow-sm dark:bg-[#191d25] border border-gray-100 dark:border-[#2b313d]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eceff4] px-5 py-4 dark:border-[#2b313d]">
                  <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5] flex items-center gap-2">
                    <FiStar className="text-yellow-500 fill-yellow-500 animate-pulse" />
                    {isEnglish ? 'Full Rankings' : 'Bảng xếp hạng chi tiết'}
                  </h3>
                </div>
                
                <div className="divide-y divide-[#eceff4] dark:divide-[#2b313d]">
                  {listUsers.map((user, index) => {
                    const rank = index + 4;
                    const isCurrentUserRow = currentUserRank && user.id === currentUserRank.id;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: Math.min(0.2, index * 0.03) }}
                        key={user.id} 
                        className={`flex items-center justify-between p-4 px-5 transition-all hover:bg-gray-50/50 dark:hover:bg-[#1f2532]/25 ${
                          isCurrentUserRow ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-l-4 border-emerald-500 pl-4' : ''
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs border shrink-0 ${
                            isCurrentUserRow 
                              ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white border-emerald-500 shadow-sm' 
                              : 'bg-[#f8f9fb] dark:bg-[#232936] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-805'
                          }`}>
                            {rank}
                          </div>
                          
                          <div className="flex items-center gap-3 min-w-0">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-gray-850 shadow-sm shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-450 font-black flex items-center justify-center shrink-0 border border-emerald-500/15">
                                {user.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h3 className="font-bold text-[#1d2430] dark:text-[#eef1f5] text-sm flex items-center gap-1.5 truncate">
                                <span className="truncate">{user.name}</span>
                                {user.isVip && (
                                  <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[8px] font-black px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">VIP</span>
                                )}
                              </h3>
                              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500">
                                <span>Lvl {user.level || 1}</span>
                                <span>•</span>
                                <span className="text-[9.5px] font-bold text-emerald-650 dark:text-emerald-400 px-1 py-0.2 bg-emerald-500/5 dark:bg-emerald-500/10 rounded border border-emerald-500/10">
                                  {getLevelTitle(user.level || 1).name}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right shrink-0">
                          <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                            {user.experience || 0}
                          </div>
                          <div className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">XP</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Scoring actions card (Col Span 4) */}
          <div className="lg:col-span-4 space-y-4">
            
            <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-[#191d25] border border-gray-100 dark:border-[#2b313d]">
              <h3 className="font-bold text-[#181c24] dark:text-[#eef1f5] mb-4 text-base flex items-center gap-2">
                <FiInfo className="text-blue-500 animate-pulse" />
                {isEnglish ? 'How to earn XP?' : 'Cơ chế tính điểm'}
              </h3>
              
              {/* Actions Grid */}
              <div className="grid grid-cols-2 gap-3">
                {guideItems.map((item, idx) => (
                  <motion.div
                    whileHover={{ y: -3 }}
                    className="p-3 bg-gray-55 dark:bg-dark-bg-hover rounded-xl border border-gray-100 dark:border-dark-border flex flex-col justify-between h-28 transition-all duration-205"
                    key={idx}
                  >
                    <div className="flex justify-between items-start">
                      <div className={`p-2 rounded-xl ${item.bgColor} ${item.color} flex items-center justify-center shrink-0`}>
                        <item.icon size={15} />
                      </div>
                      <span className="text-[9.5px] font-black text-emerald-650 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/10 shrink-0">
                        +{item.xp} XP
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-gray-805 dark:text-gray-200 mt-2">{item.title}</h4>
                      <p className="text-[9px] font-medium text-gray-450 dark:text-gray-450 mt-0.5 line-clamp-1 leading-tight">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 dark:bg-[#202530] rounded-xl text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed border border-gray-100 dark:border-gray-800">
                {isEnglish 
                  ? 'XP will accumulate to increase your level. Keep a streak going to build great habits!' 
                  : 'Điểm XP sẽ được cộng dồn để thăng cấp. Việc duy trì chuỗi (streak) giúp tạo thói quen chi tiêu tuyệt vời!'}
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </PageTransition>
  );
};

export default Leaderboard;
