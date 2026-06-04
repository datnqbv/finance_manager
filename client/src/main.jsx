// Khởi tạo và render React app vào DOM

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext.jsx'

// Render ứng dụng React vào DOM
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider> 
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
