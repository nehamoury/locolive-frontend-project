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

  // 1. Priority: Profile Completion
  if (!user.is_profile_complete) {
    if (location.pathname !== '/complete-profile') {
      return <Navigate to="/complete-profile" replace />;
    }
    // If we are already on /complete-profile, allow render
    return <>{children}</>;
  }

  // 2. Secondary: Identity Verification (only after profile is complete)
  if (!user.is_active) {
    if (location.pathname !== '/verify') {
      return <Navigate to="/verify" replace />;
    }
    // If we are already on /verify, allow render
    return <>{children}</>;
  }

  // Check admin privileges if required
  if (requireAdmin && user.role !== 'admin' && user.role !== 'moderator') {
    return <Navigate to="/dashboard/home" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
