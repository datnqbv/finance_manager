import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import PublicRoute from './components/PublicRoute';

const PrivateRoute = lazy(() => import('./components/PrivateRoute'));
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
const RecurringTransactions = lazy(() => import('./pages/RecurringTransactions'));
const Statistics = lazy(() => import('./pages/Statistics'));
const Categories = lazy(() => import('./pages/Categories'));
const Budgets = lazy(() => import('./pages/Budgets'));
const Wallets = lazy(() => import('./pages/Wallets'));
const Goals = lazy(() => import('./pages/Goals'));
const Debts = lazy(() => import('./pages/Debts'));
const Profile = lazy(() => import('./pages/Profile'));
const VipSubscription = lazy(() => import('./pages/VipSubscription'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const AdminVipPayments = lazy(() => import('./pages/AdminVipPayments'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminContacts = lazy(() => import('./pages/AdminContacts'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminVisits = lazy(() => import('./pages/AdminVisits'));

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>  
        <Router> 
          <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300">
            <Suspense fallback={
              <div className="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              </div>
            }>
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
                <Route path="/recurring" element={<PrivateRoute />}> 
                  <Route index element={<RecurringTransactions />} /> 
                </Route>
                <Route path="/categories" element={<PrivateRoute />}> 
                  <Route index element={<Categories />} /> 
                </Route>
                <Route path="/budgets" element={<PrivateRoute />}> 
                  <Route index element={<Budgets />} /> 
                </Route>
                <Route path="/wallets" element={<PrivateRoute />}> 
                  <Route index element={<Wallets />} /> 
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
                <Route path="/vip" element={<PrivateRoute />}> 
                  <Route index element={<VipSubscription />} /> 
                </Route>
                <Route path="/leaderboard" element={<PrivateRoute />}> 
                  <Route index element={<Leaderboard />} /> 
                </Route>

                <Route path="/admin" element={<PrivateRoute requiredRole="admin" />}>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="contacts" element={<AdminContacts />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="vip-payments" element={<AdminVipPayments />} />
                  <Route path="visits" element={<AdminVisits />} />
                </Route>
                
                <Route path="*" element={<Navigate to="/" replace />} /> 
              </Routes>
            </Suspense>
            
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
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
