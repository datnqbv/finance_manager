import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';
import { WalletProvider } from '../context/WalletContext';
import { CategoryProvider } from '../context/CategoryContext';
import { BudgetProvider } from '../context/BudgetContext';
import { GoalProvider } from '../context/GoalContext';
import { DebtProvider } from '../context/DebtContext';
import { TransactionProvider } from '../context/TransactionContext';

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
                  <Outlet />
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
