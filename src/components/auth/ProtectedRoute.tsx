import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/layouts/MainLayout';
import LoadingState from '@/components/primitives/LoadingState';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return <MainLayout><div className="grid min-h-[60vh] place-items-center"><LoadingState label="Opening your profile"/></div></MainLayout>;
  }

  if (!isLoggedIn) {
    return <Navigate to="/auth?mode=login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
