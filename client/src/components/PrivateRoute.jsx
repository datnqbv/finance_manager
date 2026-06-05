import { Suspense } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';
import { WalletProvider } from '../context/WalletContext';
import { CategoryProvider } from '../context/CategoryContext';
import { BudgetProvider } from '../context/BudgetContext';
import { GoalProvider } from '../context/GoalContext';
import { DebtProvider } from '../context/DebtContext';
import { TransactionProvider } from '../context/TransactionContext';
import { 
  DashboardSkeleton, 
  TransactionsPageSkeleton, 
  CategoriesSkeleton, 
  BudgetsSkeleton, 
  GoalsSkeleton, 
  DebtsSkeleton, 
  StatisticsPageSkeleton,
  WalletsSkeleton,
  RecurringTransactionsSkeleton,
  ProfileSkeleton,
  VipSubscriptionSkeleton,
  AdminDashboardSkeleton,
  AdminTableSkeleton
} from './LoadingSkeleton';

const PageFallback = () => {
  const location = useLocation();
  const path = location.pathname;

  if (path.startsWith('/dashboard')) return <DashboardSkeleton />;
  if (path.startsWith('/transactions')) return <TransactionsPageSkeleton />;
  if (path.startsWith('/categories')) return <CategoriesSkeleton />;
  if (path.startsWith('/budgets')) return <BudgetsSkeleton />;
  if (path.startsWith('/goals')) return <GoalsSkeleton />;
  if (path.startsWith('/debts')) return <DebtsSkeleton />;
  if (path.startsWith('/statistics')) return <StatisticsPageSkeleton />;
  if (path.startsWith('/wallets')) return <WalletsSkeleton />;
  if (path.startsWith('/recurring')) return <RecurringTransactionsSkeleton />;
  if (path.startsWith('/profile')) return <ProfileSkeleton />;
  if (path.startsWith('/vip')) return <VipSubscriptionSkeleton />;
  
  // Admin pages fallbacks
  if (path.startsWith('/admin/dashboard')) return <AdminDashboardSkeleton />;
  if (path.startsWith('/admin/')) return <AdminTableSkeleton />;

  // Default content spinner fallback for other routes
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
    </div>
  );
};

const PrivateRoute = ({ requiredRole }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return isAuthenticated ? (
    <WalletProvider>
      <CategoryProvider>
        <BudgetProvider>
          <GoalProvider>
            <DebtProvider>
              <TransactionProvider>
                <Layout>
                  <Suspense fallback={<PageFallback />}>
                    <Outlet />
                  </Suspense>
                </Layout>
              </TransactionProvider>
            </DebtProvider>
          </GoalProvider>
        </BudgetProvider>
      </CategoryProvider>
    </WalletProvider>
  ) : (
    <Navigate to="/login" replace />
  );
};

export default PrivateRoute;
