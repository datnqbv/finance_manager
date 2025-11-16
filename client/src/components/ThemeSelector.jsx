import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDroplet, FiCheck } from 'react-icons/fi';
import { useThemeCustomizer } from '../context/ThemeCustomizerContext';

const ThemeSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentTheme, changeTheme, themes } = useThemeCustomizer();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] 
                 hover:bg-gray-100 dark:hover:bg-[#222222] 
                 border border-gray-200 dark:border-[#2a2a2a]
                 transition-all duration-200 hover:scale-105 group"
        title="Chọn màu chủ đạo"
      >
        <FiDroplet size={20} className="text-gray-700 dark:text-gray-300 group-hover:rotate-12 transition-transform" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Theme Selector Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#111111] 
                       rounded-xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a]
                       z-50 p-4"
            >
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FiDroplet className="text-primary-600" />
                  Chọn màu chủ đạo
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Tùy chỉnh giao diện theo sở thích
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {Object.entries(themes).map(([key, theme]) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      changeTheme(key);
                      setIsOpen(false);
                    }}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-200
                              ${currentTheme === key 
                                ? 'border-gray-400 dark:border-gray-500 shadow-lg' 
                                : 'border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#3a3a3a]'
                              }`}
                  >
                    {/* Color preview */}
                    <div 
                      className={`w-full h-12 rounded-lg bg-gradient-to-br ${theme.gradient} 
                                mb-2 flex items-center justify-center`}
                    >
                      {currentTheme === key && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg"
                        >
                          <FiCheck size={14} style={{ color: theme.primary }} />
                        </motion.div>
                      )}
                    </div>

                    {/* Theme name */}
                    <p className={`text-xs font-semibold text-center
                                  ${currentTheme === key 
                                    ? 'text-gray-900 dark:text-white' 
                                    : 'text-gray-600 dark:text-gray-400'
                                  }`}
                    >
                      {theme.name}
                    </p>
                  </motion.button>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-[#2a2a2a]">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  💡 Màu sẽ được lưu tự động
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeSelector;
