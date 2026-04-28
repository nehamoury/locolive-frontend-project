import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SplashScreen from '../ui/SplashScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

/**
 * ProtectedRoute Component
 * 
 * Ensures that the user is authenticated before accessing the route.
 * Handles redirection to login if unauthenticated.
 * Handles redirection to profile completion if required.
 * Handles role-based access for admin routes.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show splash screen while verifying auth state
  if (loading) {
    return <SplashScreen />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to profile completion if user hasn't finished setup
  if (!user.is_profile_complete && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  // Check admin privileges if required
  if (requireAdmin && user.role !== 'admin' && user.role !== 'moderator') {
    return <Navigate to="/dashboard/home" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
