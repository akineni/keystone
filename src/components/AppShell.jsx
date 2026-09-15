import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotif } from '../context/NotifContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { flattenPermissions } from '../lib/permissions.js';
import { IconBell, IconGrid, IconLogout, IconMenu, IconRoles, IconShieldCheck, IconUser, IconUsers } from '../lib/icons.jsx';
import Ambient from './Ambient.jsx';
import Avatar from './Avatar.jsx';
import Logo from './Logo.jsx';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/profile': 'Profile',
  '/security': 'Security',
  '/notifications': 'Notifications',
  '/admin/users': 'Users',
  '/admin/roles': 'Roles & permissions',
};

function NavItem({ to, icon, children, badge }) {
  return (
    <NavLink to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
      {icon}
      {children}
      {badge > 0 && <span className="badge badge-accent">{badge > 99 ? '99+' : badge}</span>}
    </NavLink>
  );
}

export default function AppShell({ children }) {
  const { user, setUser, clearSession } = useAuth();
  const { unreadCount, refresh } = useNotif();
  const { toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Runs once when the authenticated area mounts (React Router keeps AppShell
  // mounted across dashboard/profile/security/etc. navigations, so, unlike
  // the old static build where every page reload re-fetched, this only
  // needs to happen on first entry).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await Api.me();
        if (!cancelled) setUser(data);
      } catch (e) {
        // A real 401 is already handled (session cleared + redirected) by the
        // global handler in api/client.js. Anything else (network/CORS
        // failure, 500, etc.) would otherwise fail silently, so surface it.
        if (!cancelled && e.status !== 401) toastError(e.message || 'Could not load your account.');
      }
    })();
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const permissions = flattenPermissions(user);
  const canAdmin = permissions.includes('user_management.view');
  const title = TITLES[location.pathname] || 'Keystone';

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await Api.logout();
    } catch (e) {
      /* proceed regardless */
    }
    clearSession();
    navigate('/login');
  }

  return (
    <>
      <Ambient />
      <div className="app-shell">
        <div className={`scrim${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(false)} />
        {menuOpen && (
          <button className="icon-btn menu-toggle menu-toggle-overlay" type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <IconMenu />
          </button>
        )}
        <aside className={`sidebar${menuOpen ? ' open' : ''}`}>
          <div className="sidebar-head">
            <Logo to="/dashboard" />
          </div>
          <nav className="sidebar-nav" onClick={() => setMenuOpen(false)}>
            <div className="nav-section">Workspace</div>
            <NavItem to="/dashboard" icon={<IconGrid />}>Dashboard</NavItem>
            <NavItem to="/profile" icon={<IconUser />}>Profile</NavItem>
            <NavItem to="/security" icon={<IconShieldCheck />}>Security</NavItem>
            <NavItem to="/notifications" icon={<IconBell />} badge={unreadCount}>Notifications</NavItem>

            {canAdmin && (
              <>
                <div className="nav-section">Administration</div>
                <NavItem to="/admin/users" icon={<IconUsers />}>Users</NavItem>
                <NavItem to="/admin/roles" icon={<IconRoles />}>Roles &amp; permissions</NavItem>
              </>
            )}
          </nav>
          <div className="sidebar-foot">
            <NavLink to="/profile" className="user-card" onClick={() => setMenuOpen(false)}>
              <Avatar user={user} size="md" />
              <div className="meta">
                <div className="name">{user ? user.fullname : 'Loading…'}</div>
                <div className="role">{user ? (user.role_names?.[0] || user.roles?.[0]?.name || 'Member') : '-'}</div>
              </div>
            </NavLink>
            <button type="button" className="nav-item" style={{ marginTop: 6, width: '100%', border: 0, background: 'none', cursor: 'pointer', font: 'inherit' }} onClick={handleLogout} disabled={loggingOut}>
              <IconLogout style={{ color: 'var(--danger)' }} />
              <span style={{ color: 'var(--danger)' }}>Log out</span>
            </button>
          </div>
        </aside>

        <div className="main-col">
          <header className="topbar">
            <button className="icon-btn menu-toggle" type="button" onClick={() => setMenuOpen((o) => !o)} aria-label="Toggle menu">
              <IconMenu />
            </button>
            <h2>{title}</h2>
            <div className="topbar-spacer" />
            <button className="icon-btn" type="button" onClick={() => navigate('/notifications')} aria-label="Notifications">
              <IconBell />
              {unreadCount > 0 && <span className="dot" />}
            </button>
            <NavLink to="/profile">
              <Avatar user={user} size="sm" />
            </NavLink>
          </header>
          <div className="page">{children}</div>
        </div>
      </div>
    </>
  );
}
