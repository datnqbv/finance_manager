import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiMessageCircle, FiMinimize2 } from 'react-icons/fi';
import Message from './Message';
import Input from './Input';
import { sendChatMessage } from '../../services/chat.service';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useTransactions } from '../../context/TransactionContext';
import { useBudgets } from '../../context/BudgetContext';
import { useGoal } from '../../context/GoalContext';
import { useDebt } from '../../context/DebtContext';
import { useCategories } from '../../context/CategoryContext';
import { useLanguage } from '../../context/LanguageContext';

const Chatbot = () => {
  const { user } = useAuth();
  const { transactions } = useTransactions();
  const { budgets } = useBudgets();
  const { goals } = useGoal();
  const { debts, stats: debtStats } = useDebt();
  const { categories } = useCategories();
  const { t, language } = useLanguage();
  const isEnglish = language === 'en';
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: isEnglish
        ? `Hello ${user?.name || 'there'}! 👋 I am your AI financial assistant. I can help you with:\n\n💰 Spending analysis\n📊 Budget tracking\n🎯 Savings goals\n💡 Financial advice\n\nHow can I support you today?`
        : `Xin chào ${user?.name || 'bạn'}! 👋 Tôi là trợ lý tài chính AI của bạn. Tôi có thể giúp bạn:\n\n💰 Phân tích chi tiêu\n📊 Theo dõi ngân sách\n🎯 Đạt mục tiêu tiết kiệm\n💡 Tư vấn tài chính\n\nBạn cần hỗ trợ gì hôm nay?`,
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);

  // Quick suggestions based on user context
  const suggestions = [
    isEnglish ? '💰 How is my spending?' : '💰 Chi tiêu của tôi thế nào?',
    isEnglish ? '📊 How much budget is left?' : '📊 Ngân sách còn bao nhiêu?',
    isEnglish ? '🎯 Goal progress' : '🎯 Tiến độ mục tiêu',
    isEnglish ? '💡 Saving advice' : '💡 Lời khuyên tiết kiệm'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text) => {
    setShowSuggestions(false);
    const userMessage = {
      id: Date.now(),
      text,
      isBot: false,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Prepare comprehensive user context for deep analysis
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Helper function to get month name based on language
      const getMonthName = (month) => {
        const months = isEnglish
          ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
          : ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
        return months[month];
      };
      
      // Get current month transactions
      const thisMonthTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
      
      // Get last month transactions
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const lastMonthTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
      });
      
      // Calculate monthly stats
      const thisMonthIncome = thisMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const thisMonthExpense = thisMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const lastMonthIncome = lastMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const lastMonthExpense = lastMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      
      // Calculate spending by category (all time)
      const categorySpending = {};
      transactions.filter(t => t.type === 'expense').forEach(t => {
        if (!categorySpending[t.category]) {
          categorySpending[t.category] = { total: 0, count: 0, transactions: [] };
        }
        categorySpending[t.category].total += t.amount;
        categorySpending[t.category].count += 1;
        categorySpending[t.category].transactions.push({
          amount: t.amount,
          date: t.date,
          note: t.note
        });
      });
      
      // Calculate spending by category - This Month
      const thisMonthCategorySpending = {};
      thisMonthTransactions.filter(t => t.type === 'expense').forEach(t => {
        if (!thisMonthCategorySpending[t.category]) {
          thisMonthCategorySpending[t.category] = { total: 0, count: 0 };
        }
        thisMonthCategorySpending[t.category].total += t.amount;
        thisMonthCategorySpending[t.category].count += 1;
      });
      
      // Calculate spending by category - Last Month
      const lastMonthCategorySpending = {};
      lastMonthTransactions.filter(t => t.type === 'expense').forEach(t => {
        if (!lastMonthCategorySpending[t.category]) {
          lastMonthCategorySpending[t.category] = { total: 0, count: 0 };
        }
        lastMonthCategorySpending[t.category].total += t.amount;
        lastMonthCategorySpending[t.category].count += 1;
      });
      
      // Get last 6 months statistics
      const last6MonthsStats = [];
      for (let i = 0; i < 6; i++) {
        const monthOffset = currentMonth - i;
        const targetMonth = monthOffset >= 0 ? monthOffset : 12 + monthOffset;
        const targetYear = monthOffset >= 0 ? currentYear : currentYear - 1;
        
        const monthTransactions = transactions.filter(t => {
          const date = new Date(t.date);
          return date.getMonth() === targetMonth && date.getFullYear() === targetYear;
        });
        
        const monthIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const monthExpense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        
        // Category breakdown for this month
        const monthCategorySpending = {};
        monthTransactions.filter(t => t.type === 'expense').forEach(t => {
          if (!monthCategorySpending[t.category]) {
            monthCategorySpending[t.category] = { total: 0, count: 0 };
          }
          monthCategorySpending[t.category].total += t.amount;
          monthCategorySpending[t.category].count += 1;
        });
        
        last6MonthsStats.push({
          month: getMonthName(targetMonth),
          year: targetYear,
          monthIndex: targetMonth,
          income: monthIncome,
          expense: monthExpense,
          balance: monthIncome - monthExpense,
          transactionCount: monthTransactions.length,
          categoryBreakdown: monthCategorySpending
        });
      }
      
      // Top spending categories (all time)
      const topCategories = Object.entries(categorySpending)
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      
      // Calculate daily average
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const currentDay = now.getDate();
      const dailyAverageThisMonth = thisMonthExpense / currentDay;
      const dailyAverageLastMonth = lastMonthExpense / new Date(lastMonthYear, lastMonth + 1, 0).getDate();
      
      // Recent transactions (last 10)
      const recentTransactions = transactions.slice(0, 10);
      
      // Total statistics
      const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      
      const userContext = {
        userName: user?.name,
        currentDate: now.toLocaleDateString(isEnglish ? 'en-US' : 'vi-VN'),
        currentMonthName: getMonthName(currentMonth),
        currentYear: currentYear,
        
        // Overall stats
        totalTransactions: transactions.length,
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        
        // Last 6 months statistics (for historical queries)
        last6Months: last6MonthsStats.slice(0, 6),
        
        // This month stats
        thisMonth: {
          income: thisMonthIncome,
          expense: thisMonthExpense,
          balance: thisMonthIncome - thisMonthExpense,
          transactionCount: thisMonthTransactions.length,
          dailyAverage: dailyAverageThisMonth,
          categoryBreakdown: thisMonthCategorySpending
        },
        
        // Last month stats
        lastMonth: {
          income: lastMonthIncome,
          expense: lastMonthExpense,
          balance: lastMonthIncome - lastMonthExpense,
          transactionCount: lastMonthTransactions.length,
          dailyAverage: dailyAverageLastMonth,
          categoryBreakdown: lastMonthCategorySpending
        },
        
        // Comparison
        monthComparison: {
          incomeChange: thisMonthIncome - lastMonthIncome,
          incomeChangePercent: lastMonthIncome > 0 ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome * 100).toFixed(1) : 0,
          expenseChange: thisMonthExpense - lastMonthExpense,
          expenseChangePercent: lastMonthExpense > 0 ? ((thisMonthExpense - lastMonthExpense) / lastMonthExpense * 100).toFixed(1) : 0
        },
        
        // Category analysis (all time)
        topSpendingCategories: topCategories.map(c => ({
          category: c.category,
          total: c.total,
          count: c.count,
          average: c.total / c.count
        })),
        
        // Recent transactions
        recentTransactions: recentTransactions.slice(0, 5).map(t => ({
          type: t.type,
          category: t.category,
          amount: t.amount,
          date: t.date,
          note: t.note
        })),
        
        // Budgets
        budgets: budgets.map(b => ({
          category: b.category,
          limit: b.limit,
          spent: b.spent || 0,
          remaining: b.limit - (b.spent || 0),
          percentUsed: ((b.spent || 0) / b.limit * 100).toFixed(1)
        })),
        
        // Goals
        goals: goals.map(g => ({
          name: g.name,
          target: g.targetAmount,
          current: g.currentAmount || 0,
          remaining: g.targetAmount - (g.currentAmount || 0),
          progress: ((g.currentAmount || 0) / g.targetAmount * 100).toFixed(1),
          deadline: g.deadline,
          priority: g.priority,
          isAchieved: g.isAchieved
        })),

        // Categories
        categories: categories.map(c => ({
          name: c.name,
          type: c.type,
          icon: c.icon,
          color: c.color
        })),

        // Debts
        debts: debts.map(d => ({
          name: d.name,
          debtType: d.debtType, // 'lend' hoặc 'borrow'
          totalAmount: d.totalAmount,
          remainingAmount: d.remainingAmount,
          paidAmount: d.totalAmount - (d.remainingAmount || d.totalAmount),
          status: d.status,
          dueDate: d.dueDate,
          personName: d.personName,
          interestRate: d.interestRate
        })),
        debtSummary: debtStats ? {
          totalLent: debtStats.totalLent || 0,
          totalBorrowed: debtStats.totalBorrowed || 0,
          totalLentRemaining: debtStats.totalLentRemaining || 0,
          totalBorrowedRemaining: debtStats.totalBorrowedRemaining || 0
        } : null
      };

      const response = await sendChatMessage(text, userContext);
      
      const botMessage = {
        id: Date.now() + 1,
        text: response.message,
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(isEnglish ? 'Unable to send message. Please try again!' : 'Không thể gửi tin nhắn. Vui lòng thử lại!');
      
      const errorMessage = {
        id: Date.now() + 1,
        text: isEnglish
          ? 'Sorry, I am having a technical issue. Please try again later! 😊'
          : 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau nhé! 😊',
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const cleanText = suggestion.replace(/[💰📊🎯💡]/g, '').trim();
    handleSendMessage(cleanText);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-11 h-11 bg-[#003d2d] hover:bg-[#00523d] text-white rounded-full shadow-2xl hover:shadow-[#003d2d]/50 hover:scale-110 transition-all duration-300 flex items-center justify-center z-50 group"
          aria-label="Open chatbot"
        >
          <FiMessageCircle size={20} className="group-hover:rotate-12 transition-transform" />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white 
                        animate-pulse"></div>
        </button>
      )}

      {isOpen && (
        <div className={`fixed bottom-6 right-6 w-[420px] bg-white dark:bg-[#151a18] 
                      rounded-2xl shadow-2xl flex flex-col z-50 border border-[#d3e1da] dark:border-[#31453d]
                      transition-all duration-300 ${
                        isMinimized ? 'h-16' : 'h-[650px]'
                      }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-[#003d2d]
                        text-white rounded-t-2xl cursor-pointer"
               onClick={() => setIsMinimized(!isMinimized)}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center 
                              backdrop-blur-sm">
                  <FiMessageCircle size={20} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 
                              border-white animate-pulse"></div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Finance Assistant</h3>
                <p className="text-xs opacity-90 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  {isEnglish ? 'Online' : 'Trực tuyến'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Minimize chatbot"
              >
                <FiMinimize2 size={18} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close chatbot"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-[#f4faf7] to-white 
                            dark:from-[#1a231f] dark:to-[#151a18]">
                {messages.map((message) => (
                  <Message key={message.id} message={message} isBot={message.isBot} user={user} />
                ))}
                
                {/* Typing Indicator */}
                {isLoading && (
                  <div className="flex gap-3 animate-in fade-in duration-300">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#003d2d]
                                  flex items-center justify-center text-white shadow-lg">
                      <FiMessageCircle size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="inline-block bg-white dark:bg-[#1f2c27] px-5 py-3 rounded-2xl shadow-md 
                                    border border-[#dbe8e1] dark:border-[#2d4138]">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 bg-[#003d2d] rounded-full animate-bounce"
                               style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2.5 h-2.5 bg-[#003d2d] rounded-full animate-bounce"
                               style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2.5 h-2.5 bg-[#003d2d] rounded-full animate-bounce"
                               style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Quick Suggestions */}
                {showSuggestions && messages.length === 1 && !isLoading && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium px-2">
                      {isEnglish ? '💡 Quick suggestions:' : '💡 Gợi ý nhanh:'}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-3 py-2 text-sm bg-white dark:bg-[#1e2a25] border-2 border-[#dbe8e1] 
                                   dark:border-[#32473e] rounded-xl hover:border-[#00523d]
                                   hover:bg-[#edf7f2] dark:hover:bg-[#23332d] transition-all
                                   text-gray-700 dark:text-gray-300 text-left font-medium
                                   hover:shadow-md hover:scale-105"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              <Input onSendMessage={handleSendMessage} disabled={isLoading} />
            </>
          )}
        </div>
      )}
    </>
  );
};

export default Chatbot;
