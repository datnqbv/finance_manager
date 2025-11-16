import { createContext, useContext, useState, useEffect } from 'react';

const ThemeCustomizerContext = createContext();

const themes = {
  purple: {
    name: 'Purple',
    primary: '#8b5cf6',
    primaryLight: '#a78bfa',
    primaryDark: '#7c3aed',
    gradient: 'from-purple-500 to-violet-600',
  },
  blue: {
    name: 'Blue',
    primary: '#3b82f6',
    primaryLight: '#60a5fa',
    primaryDark: '#2563eb',
    gradient: 'from-blue-500 to-indigo-600',
  },
  green: {
    name: 'Green',
    primary: '#10b981',
    primaryLight: '#34d399',
    primaryDark: '#059669',
    gradient: 'from-green-500 to-emerald-600',
  },
  pink: {
    name: 'Pink',
    primary: '#ec4899',
    primaryLight: '#f472b6',
    primaryDark: '#db2777',
    gradient: 'from-pink-500 to-rose-600',
  },
  orange: {
    name: 'Orange',
    primary: '#f59e0b',
    primaryLight: '#fbbf24',
    primaryDark: '#d97706',
    gradient: 'from-orange-500 to-amber-600',
  },
  cyan: {
    name: 'Cyan',
    primary: '#06b6d4',
    primaryLight: '#22d3ee',
    primaryDark: '#0891b2',
    gradient: 'from-cyan-500 to-blue-600',
  },
};

export const ThemeCustomizerProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('theme-color');
    return saved || 'purple';
  });

  useEffect(() => {
    localStorage.setItem('theme-color', currentTheme);
    
    // Apply CSS variables
    const theme = themes[currentTheme];
    document.documentElement.style.setProperty('--color-primary', theme.primary);
    document.documentElement.style.setProperty('--color-primary-light', theme.primaryLight);
    document.documentElement.style.setProperty('--color-primary-dark', theme.primaryDark);
  }, [currentTheme]);

  const changeTheme = (themeName) => {
    setCurrentTheme(themeName);
  };

  return (
    <ThemeCustomizerContext.Provider value={{ currentTheme, changeTheme, themes }}>
      {children}
    </ThemeCustomizerContext.Provider>
  );
};

export const useThemeCustomizer = () => {
  const context = useContext(ThemeCustomizerContext);
  if (!context) {
    throw new Error('useThemeCustomizer must be used within ThemeCustomizerProvider');
  }
  return context;
};
