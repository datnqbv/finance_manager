import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicRoute = () => {
  const { user } = useAuth();
  
  // Nếu đã đăng nhập -> chuyển vào dashboard
  // Nếu chưa đăng nhập -> hiển thị landing page
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/home" replace />;
};

export default PublicRoute;
