import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  
  // Check if we have the required state data
  const isAuthenticated = location.state && 
                          location.state.roomCode && 
                          location.state.userId;
  
  if (!isAuthenticated) {
    // Redirect to join page if not authenticated
    return <Navigate to="/" replace />;
  }
  
  // Render the protected component
  return <>{children}</>;
};

export default ProtectedRoute;