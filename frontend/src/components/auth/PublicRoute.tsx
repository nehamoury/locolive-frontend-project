import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SplashScreen from '../ui/SplashScreen';

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * PublicRoute Component
 * 
 * Prevents authenticated users from accessing public pages like Login or Signup.
 * Redirects authenticated users to the dashboard.
 */
export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // Show splash screen while verifying auth state
  if (loading) {
    return <SplashScreen />;
  }

  // Redirect to dashboard if user is already authenticated
  if (user) {
    return <Navigate to="/dashboard/home" replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
