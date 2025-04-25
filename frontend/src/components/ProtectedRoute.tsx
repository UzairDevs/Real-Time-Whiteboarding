import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  
  
  const isAuthenticated = location.state && 
                          location.state.roomCode && 
                          location.state.userId;
  
  if (!isAuthenticated) {
   
    return <Navigate to="/" replace />;
  }
  
  
  return <>{children}</>;
};

export default ProtectedRoute;