import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../shared/store/hooks";
import { fetchMe } from "../features/auth/authSlice";
import { initSocket } from "../shared/services/socket";
import { LoginPage } from "../features/auth/LoginPage";
import { RegisterPage } from "../features/auth/RegisterPage";
import { AppLayout } from "../shared/components/layout/AppLayout";
import {
  ProtectedRoute,
  GuestRoute,
} from "../shared/components/layout/RouteGuards";
import { Spinner } from "../shared/components/ui/Spinner";

const AppRoutes = () => {
  const dispatch = useAppDispatch();
  const { accessToken, status } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (accessToken) {
      // Re-hydrate user from token
      dispatch(fetchMe());
      initSocket(accessToken);
    }
  }, [accessToken, dispatch]);

  // Wait for session rehydration
  if (accessToken && status === "idle") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const App = () => (
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
);
