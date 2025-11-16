/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable dark mode with class strategy
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: 'var(--color-primary-light, #38bdf8)',
          500: 'var(--color-primary, #0ea5e9)',
          600: 'var(--color-primary-dark, #0284c7)',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        income: '#10b981',
        expense: '#ef4444',
        // Dark theme colors
        dark: {
          bg: {
            primary: '#0a0a0a',
            secondary: '#111111',
            tertiary: '#1a1a1a',
            hover: '#222222',
          },
          border: '#2a2a2a',
          text: {
            primary: '#ffffff',
            secondary: '#f9f9f9ff',
            tertiary: '#f4f4f4ff',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'dark-sm': '0 1px 2px 0 rgba(255, 255, 255, 0.05)',
        'dark-md': '0 4px 6px -1px rgba(255, 255, 255, 0.1)',
        'dark-lg': '0 10px 15px -3px rgba(255, 255, 255, 0.1)',
      },
    },
  },
  plugins: [],
}
