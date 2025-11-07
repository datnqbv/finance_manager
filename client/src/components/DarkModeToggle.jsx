import { useTheme } from '../context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';

const DarkModeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 
                dark:from-[#1a1a1a] dark:to-[#222222] 
                hover:scale-105 active:scale-95 transition-all duration-200
                border border-gray-200 dark:border-[#2a2a2a]
                shadow-sm group"
      title={isDarkMode ? 'Chuyển sang Light Mode' : 'Chuyển sang Dark Mode'}
    >
      <div className="relative w-5 h-5">
        {isDarkMode ? (
          <FiSun className="w-5 h-5 text-yellow-500 animate-in spin-in-180 duration-500" />
        ) : (
          <FiMoon className="w-5 h-5 text-gray-700 animate-in spin-in-180 duration-500" />
        )}
      </div>
    </button>
  );
};

export default DarkModeToggle;
