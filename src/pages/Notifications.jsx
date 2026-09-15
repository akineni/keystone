import { useCallback, useEffect, useState } from 'react';
import { Api } from '../api/client.js';
import { useNotif } from '../context/NotifContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { debounce, fmtDate, timeAgo } from '../lib/format.js';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import { IconAlert, IconCopy, IconEdit, IconInfo, IconLock, IconRoleAssigned, IconRoleRevoked, IconRoles, IconSearch, IconShieldCheck, IconTrash, IconUsers, IconX } from '../lib/icons.jsx';

const TYPE_ICON = {
  login_detected: <IconShieldCheck />,
  password_changed: <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.6" /></svg>,
  role_assigned: <IconRoleAssigned />,
  role_revoked: <IconRoleRevoked />,
  user_role_modified: <IconUsers />,
  security_alert: <IconAlert />,
  two_fa_enabled: <IconLock />,
  two_fa_disabled: <IconAlert />,
  recovery_codes_regenerated: <IconCopy />,
  account_deactivated: <IconX />,
  account_deleted: <IconTrash />,
  profile_updated: <IconEdit />,
  account_locked: <IconLock />,
  role_permissions_updated: <IconRoles />,
  role_deleted: <IconTrash />,
};

const PER_PAGE = 8;

export default function Notifications() {
  const { refresh } = useNotif();
  const { toastSuccess, toastError } = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState(null);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);
  const [markAllLoading, setMarkAllLoading] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await Api.listNotifications({ search: search || undefined, status: status || undefined, type: type || undefined, per_page: PER_PAGE, page });
      setItems(res.data || []);
      setMeta(res.meta || null);
    } catch (err) {
      setError(err.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, type, page]);

  useEffect(() => {
    load();
  }, [load]);

  const debouncedSetSearch = useCallback(
    debounce((v) => {
      setPage(1);
      setSearch(v);
    }, 350),
    []
  );

  async function openDetail(n) {
    setDetail(n);
    if (!n.read_at) {
      try {
        await Api.markNotificationRead(n.id);
        setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
        refresh();
      } catch (e) {
        /* non-fatal */
      }
    }
  }

  async function deleteOne(id) {
    try {
      await Api.deleteNotification(id);
      setDetail(null);
      load();
      refresh();
    } catch (err) {
      toastError(err.message);
    }
  }

  async function markAll() {
    setMarkAllLoading(true);
    try {
      await Api.markAllNotificationsRead();
      toastSuccess('All notifications marked as read.');
      load();
      refresh();
    } catch (err) {
      toastError(err.message);
    } finally {
      setMarkAllLoading(false);
    }
  }

  return (
    <>
      <div className="toolbar">
        <div className="search-box">
          <IconSearch />
          <input className="input" placeholder="Search notifications…" onChange={(e) => debouncedSetSearch(e.target.value)} />
        </div>
        <select
          className="input"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
        <select
          className="input"
          value={type}
          onChange={(e) => {
            setPage(1);
            setType(e.target.value);
          }}
        >
          <option value="">All types</option>
          <option value="login_detected">Login detected</option>
          <option value="password_changed">Password changed</option>
          <option value="role_assigned">Role assigned</option>
          <option value="role_revoked">Role revoked</option>
          <option value="user_role_modified">User role modified</option>
          <option value="security_alert">Security alert</option>
          <option value="two_fa_enabled">2FA enabled</option>
          <option value="two_fa_disabled">2FA disabled</option>
          <option value="recovery_codes_regenerated">Recovery codes regenerated</option>
          <option value="account_deactivated">Account deactivated</option>
          <option value="account_deleted">Account deleted</option>
          <option value="profile_updated">Profile updated</option>
          <option value="account_locked">Account locked</option>
          <option value="role_permissions_updated">Role permissions updated</option>
          <option value="role_deleted">Role deleted</option>
        </select>
        <div className="toolbar-spacer" />
        <Button variant="secondary" size="sm" loading={markAllLoading} onClick={markAll}>Mark all as read</Button>
      </div>

      <div className="card" style={{ padding: 8 }}>
        {error && (
          <div className="empty">
            <div className="ic"><IconAlert /></div>
            <h4>Could not load notifications</h4>
            <p className="text-muted" style={{ fontSize: 13 }}>{error}</p>
          </div>
        )}
        {!error && items === null && (
          <>
            <div className="skel" style={{ height: 70, margin: 8 }} />
            <div className="skel" style={{ height: 70, margin: 8 }} />
            <div className="skel" style={{ height: 70, margin: 8 }} />
          </>
        )}
        {!error && items && items.length === 0 && (
          <div className="empty">
            <div className="ic"><IconInfo /></div>
            <h4>No notifications</h4>
            <p className="text-muted" style={{ fontSize: 13 }}>You&apos;re all caught up.</p>
          </div>
        )}
        {!error &&
          items &&
          items.map((n) => (
            <div key={n.id} className={`notif-row${!n.read_at ? ' unread' : ''}`} onClick={() => openDetail(n)}>
              <div className="ic" style={{ background: 'var(--surface)', color: n.severity === 'warning' ? 'var(--warning)' : 'var(--accent)' }}>
                {TYPE_ICON[n.type] || <IconInfo />}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{n.title}</div>
                  <div className="text-subtle" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{timeAgo(n.created_at)}</div>
                </div>
                {n.message && <div className="text-muted" style={{ fontSize: 13, marginTop: 3 }}>{n.message}</div>}
              </div>
              <button
                className="icon-btn btn-sm"
                style={{ width: 32, height: 32, flexShrink: 0 }}
                aria-label="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteOne(n.id);
                }}
              >
                <IconTrash width="15" height="15" />
              </button>
            </div>
          ))}
      </div>

      {meta && meta.total > 0 && (
        <div className="pagination">
          <div className="info">
            Showing {meta.from || 0}–{meta.to || 0} of {meta.total}
          </div>
          <div className="controls">
            <Button variant="secondary" size="sm" disabled={meta.current_page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="secondary" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title || 'Notification'} maxWidth={440}>
        <div className="text-muted" style={{ fontSize: 13.5 }}>
          <p style={{ marginBottom: 14 }}>{detail?.message || 'No additional details.'}</p>
          {detail && (
            <div style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>
              {fmtDate(detail.created_at)} · <span className={`badge badge-${detail.severity === 'warning' ? 'warning' : 'info'}`}>{detail.severity}</span>
            </div>
          )}
        </div>
        <div className="modal-actions">
          <Button variant="danger" size="sm" onClick={() => detail && deleteOne(detail.id)}>Delete</Button>
          <Button variant="secondary" onClick={() => setDetail(null)}>Close</Button>
        </div>
      </Modal>
    </>
  );
}
