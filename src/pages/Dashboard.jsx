import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotif } from '../context/NotifContext.jsx';
import { fmtDate, timeAgo } from '../lib/format.js';
import { IconBell, IconInfo, IconShieldCheck, IconUser, IconCalendar } from '../lib/icons.jsx';

const STATUS_BADGE = { active: 'success', pending: 'warning', inactive: 'neutral', suspended: 'danger' };

export default function Dashboard() {
  const { user } = useAuth();
  const { unreadCount } = useNotif();
  const [items, setItems] = useState(null);
  const [itemsError, setItemsError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Api.listNotifications({ per_page: 5 })
      .then((res) => !cancelled && setItems(res.data || []))
      .catch((err) => !cancelled && setItemsError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) {
    return (
      <div className="grid grid-4">
        {[0, 1, 2, 3].map((i) => (
          <div className="skel" style={{ height: 120 }} key={i} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="section-head fade-up">
        <div>
          <h3 style={{ fontSize: 24 }}>Welcome back, {user.firstname || 'there'}</h3>
          <div className="sub">Here&apos;s what&apos;s happening with your account.</div>
        </div>
        <Link to="/profile" className="btn btn-secondary btn-sm">Edit profile</Link>
      </div>

      <div className="grid grid-4 fade-up" style={{ animationDelay: '.05s' }}>
        <div className="card stat-card">
          <div className="top"><div className="ic"><IconShieldCheck /></div></div>
          <div className="val">
            <span className={`badge badge-${STATUS_BADGE[user.status] || 'neutral'}`} style={{ fontSize: 13, padding: '5px 12px' }}>
              <span className="badge-dot" />
              {user.status}
            </span>
          </div>
          <div className="lbl">Account status</div>
        </div>
        <div className="card stat-card">
          <div className="top"><div className="ic"><IconShieldCheck /></div></div>
          <div className="val">
            {user.two_fa ? (
              <span className="badge badge-success" style={{ fontSize: 13, padding: '5px 12px' }}><span className="badge-dot" />Enabled</span>
            ) : (
              <span className="badge badge-neutral" style={{ fontSize: 13, padding: '5px 12px' }}>Off</span>
            )}
          </div>
          <div className="lbl">Two-factor auth</div>
        </div>
        <div className="card stat-card">
          <div className="top"><div className="ic"><IconBell /></div></div>
          <div className="val">{unreadCount}</div>
          <div className="lbl">Unread notifications</div>
        </div>
        <div className="card stat-card">
          <div className="top"><div className="ic"><IconCalendar /></div></div>
          <div className="val" style={{ fontSize: 18 }}>{fmtDate(user.created_at)}</div>
          <div className="lbl">Member since</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 24, alignItems: 'start' }}>
        <div className="card card-pad fade-up" style={{ animationDelay: '.1s' }}>
          <div className="section-head" style={{ marginBottom: 16 }}>
            <h3>Quick actions</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to="/profile" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <IconUser width="17" height="17" /> Update your profile
            </Link>
            <Link to="/security" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <IconShieldCheck width="17" height="17" /> Turn on two-factor auth
            </Link>
            <Link to="/notifications" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <IconBell width="17" height="17" /> Review notifications
            </Link>
          </div>
        </div>

        <div className="card card-pad fade-up" style={{ animationDelay: '.15s' }}>
          <div className="section-head" style={{ marginBottom: 16 }}>
            <h3>Recent activity</h3>
            <Link to="/notifications" className="text-muted" style={{ fontSize: 12.5, fontWeight: 600 }}>View all</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {itemsError && <div className="text-subtle" style={{ fontSize: 13 }}>Could not load recent activity.</div>}
            {!itemsError && items === null && (
              <>
                <div className="skel" style={{ height: 52, marginBottom: 8 }} />
                <div className="skel" style={{ height: 52, marginBottom: 8 }} />
                <div className="skel" style={{ height: 52 }} />
              </>
            )}
            {!itemsError && items && items.length === 0 && (
              <div className="empty" style={{ padding: '30px 10px' }}>
                <div className="ic"><IconInfo /></div>
                <h4>No activity yet</h4>
                <p className="text-muted" style={{ fontSize: 12.5 }}>Security and account events will show up here.</p>
              </div>
            )}
            {!itemsError &&
              items &&
              items.map((n) => (
                <div key={n.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 4px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: n.severity === 'warning' ? 'var(--warning)' : 'var(--accent)' }}>
                    <IconInfo />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>{timeAgo(n.created_at)}</div>
                  </div>
                  {!n.read_at && <span className="badge-dot" style={{ background: 'var(--accent)', width: 8, height: 8, marginTop: 6 }} />}
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
}
