import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../../features/auth/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, accessToken, status, error } = useAppSelector(s => s.auth);

  return {
    user,
    accessToken,
    isAuthenticated: !!user && !!accessToken,
    isLoading: status === 'loading',
    error,
    logout: () => dispatch(logout()),
  };
};
