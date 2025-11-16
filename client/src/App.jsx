// Định nghĩa cấu trúc và routing toàn app

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { TransactionProvider } from './context/TransactionContext';
import { CategoryProvider } from './context/CategoryContext';
import { BudgetProvider } from './context/BudgetContext';
import { RecurringProvider } from './context/RecurringContext';
import { GoalProvider } from './context/GoalContext';
import { ThemeCustomizerProvider } from './context/ThemeCustomizerContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Statistics from './pages/Statistics';
import Categories from './pages/Categories';
import Budgets from './pages/Budgets';
import RecurringTransactions from './pages/RecurringTransactions';
import Goals from './pages/Goals';
import Profile from './pages/Profile';

// hàm App chính của ứng dụng
function App() {
  return (
    <ThemeCustomizerProvider>
      <AuthProvider>  
        <CategoryProvider> 
          <BudgetProvider> 
            <RecurringProvider> 
              <GoalProvider> 
                <TransactionProvider>
                  <Router> 
          <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300">
            <Routes>
              <Route path="/login" element={<Login />} /> 
              <Route path="/register" element={<Register />} /> 
              <Route path="/forgot-password" element={<ForgotPassword />} /> 
              
              <Route path="/" element={<PrivateRoute />}> 
                <Route index element={<Dashboard />} /> 
                <Route path="transactions" element={<Transactions />} /> 
                <Route path="categories" element={<Categories />} /> 
                <Route path="budgets" element={<Budgets />} /> 
                <Route path="recurring" element={<RecurringTransactions />} /> 
                <Route path="goals" element={<Goals />} /> 
                <Route path="statistics" element={<Statistics />} /> 
                <Route path="profile" element={<Profile />} /> 
              </Route>
              
              <Route path="*" element={<Navigate to="/" replace />} /> 
            </Routes>
            
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={true}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </div>
              </Router> 
              </TransactionProvider> 
            </GoalProvider>        
          </RecurringProvider> 
        </BudgetProvider>  
      </CategoryProvider>
    </AuthProvider>
    </ThemeCustomizerProvider>
  );
}

export default App;
