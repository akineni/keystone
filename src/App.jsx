import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider, useToast } from './context/ToastContext.jsx';
import { NotifProvider } from './context/NotifContext.jsx';
import { takeFlash } from './lib/storage.js';
import { ProtectedLayout, PublicOnlyRoute } from './components/guards.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import VerifyOtp from './pages/VerifyOtp.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import ActivateAccount from './pages/ActivateAccount.jsx';
import SsoCallback from './pages/SsoCallback.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import Security from './pages/Security.jsx';
import Notifications from './pages/Notifications.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminRoles from './pages/AdminRoles.jsx';
import NotFound from './pages/NotFound.jsx';

function FlashListener() {
  const { toast } = useToast();
  const location = useLocation();
  useEffect(() => {
    const flash = takeFlash();
    if (flash) toast({ type: flash.type || 'info', title: flash.title, message: flash.msg });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);
  return null;
}

function AppRoutes() {
  return (
    <>
      <FlashListener />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
        <Route path="/reset-password" element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />
        <Route path="/activate-account" element={<PublicOnlyRoute><ActivateAccount /></PublicOnlyRoute>} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/sso-callback" element={<SsoCallback />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/security" element={<Security />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/roles" element={<AdminRoles />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <NotifProvider>
          <AppRoutes />
        </NotifProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
