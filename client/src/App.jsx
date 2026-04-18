// Định nghĩa cấu trúc và routing toàn app

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { TransactionProvider } from './context/TransactionContext';
import { CategoryProvider } from './context/CategoryContext';
import { BudgetProvider } from './context/BudgetContext';
import { GoalProvider } from './context/GoalContext';
import { DebtProvider } from './context/DebtContext';
import { LanguageProvider } from './context/LanguageContext';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Statistics from './pages/Statistics';
import Categories from './pages/Categories';
import Budgets from './pages/Budgets';
import Goals from './pages/Goals';
import Debts from './pages/Debts';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AdminContacts from './pages/AdminContacts';
import AdminUsers from './pages/AdminUsers';

// hàm App chính của ứng dụng
function App() {
  return (
    <LanguageProvider>
      <AuthProvider>  
        <CategoryProvider> 
          <BudgetProvider> 
              <GoalProvider> 
                <DebtProvider>
                <TransactionProvider>
                  <Router> 
          <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<PublicRoute />} />
              <Route path="/home" element={<Landing />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/login" element={<Login />} /> 
              <Route path="/register" element={<Register />} /> 
              <Route path="/forgot-password" element={<ForgotPassword />} /> 
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={<PrivateRoute />}> 
                <Route index element={<Dashboard />} /> 
              </Route>
              <Route path="/transactions" element={<PrivateRoute />}> 
                <Route index element={<Transactions />} /> 
              </Route>
              <Route path="/categories" element={<PrivateRoute />}> 
                <Route index element={<Categories />} /> 
              </Route>
              <Route path="/budgets" element={<PrivateRoute />}> 
                <Route index element={<Budgets />} /> 
              </Route>
              <Route path="/goals" element={<PrivateRoute />}> 
                <Route index element={<Goals />} /> 
              </Route>
              <Route path="/debts" element={<PrivateRoute />}> 
                <Route index element={<Debts />} /> 
              </Route>
              <Route path="/statistics" element={<PrivateRoute />}> 
                <Route index element={<Statistics />} /> 
              </Route>
              <Route path="/profile" element={<PrivateRoute />}> 
                <Route index element={<Profile />} /> 
              </Route>

              <Route path="/admin" element={<PrivateRoute requiredRole="admin" />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="contacts" element={<AdminContacts />} />
                <Route path="users" element={<AdminUsers />} />
              </Route>
              
              <Route path="*" element={<Navigate to="/" replace />} /> 
            </Routes>
            
            <ToastContainer
              position="top-right"
              autoClose={500}
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
                </DebtProvider>
            </GoalProvider>        
        </BudgetProvider>  
      </CategoryProvider>
    </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
