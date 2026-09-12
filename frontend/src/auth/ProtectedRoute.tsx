import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { Role } from '../services/authService';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: Role;
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F8F7]">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Restoring secure session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role !== requiredRole) {
    // Determine where to redirect them based on their actual role
    let dashboardPath = '/login';
    switch (role) {
      case 'ADMIN': dashboardPath = '/admin'; break;
      case 'TRANSPORT_MANAGER': dashboardPath = '/transport'; break;
      case 'FIELD_OFFICIAL': dashboardPath = '/field'; break;
      case 'DISASTER_OFFICIAL': dashboardPath = '/disaster'; break;
    }
    
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
};
