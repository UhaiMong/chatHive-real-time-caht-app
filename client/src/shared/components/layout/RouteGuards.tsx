import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { Spinner } from '../ui/Spinner';
import type { ReactNode } from 'react';

interface RouteGuardProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: RouteGuardProps) => {
  const { user, accessToken, status } = useAppSelector(s => s.auth);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const GuestRoute = ({ children }: RouteGuardProps) => {
  const { user, accessToken } = useAppSelector(s => s.auth);

  if (user && accessToken) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
