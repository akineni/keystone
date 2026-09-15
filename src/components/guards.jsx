import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { hasPermission } from '../lib/permissions.js';
import AppShell from './AppShell.jsx';

/** Gate for the whole authenticated area, mirrors requireAuth() (presence check only;
 *  AppShell's own Api.me() call is what actually validates the token). */
export function ProtectedLayout() {
  const { isAuthed } = useAuth();
  const location = useLocation();
  if (!isAuthed) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

/**
 * For login/register/forgot-password/reset-password/activate-account: a token
 * merely existing doesn't mean it still works (expired, revoked by a newer
 * login elsewhere, idle timeout): blindly trusting it would bounce the
 * visitor to the dashboard, which then 401s and bounces them right back
 * (the exact login/dashboard flicker bug fixed earlier). Verify first.
 */
export function PublicOnlyRoute({ children }) {
  const { isAuthed, setUser, clearSession } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthed) return;
    let cancelled = false;
    Api.me()
      .then(({ data }) => {
        if (cancelled) return;
        setUser(data);
        navigate('/dashboard', { replace: true });
      })
      .catch(() => {
        if (!cancelled) clearSession();
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  return children;
}

/** Wraps admin-only page content; waits for the user to be loaded, then gates on a permission. */
export function PermissionGate({ permission, children }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !hasPermission(user, permission)) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, permission, navigate]);

  if (!user || !hasPermission(user, permission)) return null;
  return children;
}
