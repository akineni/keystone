import { Link } from 'react-router-dom';
import Ambient from '../components/Ambient.jsx';
import Logo from '../components/Logo.jsx';
import { IconArrowRight, IconMail, IconRoles, IconShield, IconShieldCheck, IconUsers, IconBell, IconRoleAssigned } from '../lib/icons.jsx';

const FEATURES = [
  { icon: <IconShield />, title: 'Passwordless-ready sign-in', desc: 'Email/username login with automatic branching into email OTP or authenticator-app challenges, so there are no dead ends.' },
  { icon: <IconMail />, title: "Recovery that doesn't leak", desc: 'Anti-enumeration forgot-password flow with secure token exchange and forced re-authentication.' },
  { icon: <IconShieldCheck />, title: 'Authenticator-app 2FA', desc: 'Full TOTP enrollment: QR provisioning, confirmation, one-time recovery codes, and disable, all self-serve.' },
  { icon: <IconUsers />, title: 'Admin user management', desc: 'Search, create, activate, suspend, and assign roles, gated behind live permission checks from your API.' },
  { icon: <IconRoles />, title: 'Role & permission designer', desc: 'Compose custom roles from the permissions your backend exposes, and see usage counts at a glance.' },
  { icon: <IconBell />, title: 'Live notifications', desc: 'Security alerts, role changes, and login events, with read state synced back to the API.' },
];

const ENDPOINTS = [
  ['POST', '/auth/register'],
  ['POST', '/auth/login'],
  ['POST', '/auth/verify-otp'],
  ['POST', '/auth/forgot-password'],
  ['POST', '/auth/reset-password'],
  ['GET', '/users/me'],
  ['PATCH', '/users/me'],
  ['POST', '/user/two-fa/authenticator/setup'],
  ['GET', '/notifications'],
  ['GET', '/users'],
  ['GET', '/roles'],
  ['GET', '/auth/sso/google/url'],
];

export default function Landing() {
  return (
    <>
      <Ambient />
      <header className="nav-public">
        <div className="container row">
          <Logo />
          <nav className="links">
            <a href="#features">Features</a>
            <a href="#endpoints">API surface</a>
            <a href="#security">Security</a>
          </nav>
          <div className="cta">
            <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Create account</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="hero container">
          <div className="fade-up">
            <h1>
              Identity infrastructure <span className="grad">your users actually trust.</span>
            </h1>
            <p className="lede">
              Keystone is the reference front end for your auth API: registration, email &amp; TOTP verification, password recovery, session-aware dashboards, and full role &amp; permission administration, wired straight to the endpoints you already shipped.
            </p>
            <div className="actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Get started free
                <IconArrowRight width="16" height="16" />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">Sign in to your account</Link>
            </div>
          </div>

          <div className="hero-visual fade-up" style={{ animationDelay: '.1s' }}>
            <div className="bar">
              <span className="dot" style={{ background: '#f87171' }} />
              <span className="dot" style={{ background: '#fbbf24' }} />
              <span className="dot" style={{ background: '#34d399' }} />
              <span className="text-subtle mono" style={{ marginLeft: 12, fontSize: 12 }}>keystone/dashboard</span>
            </div>
            <div className="body">
              <div>
                <div className="orbit-stats">
                  <div className="stat">
                    <div className="ic"><IconShield stroke="#fff" /></div>
                    <div><div className="t">JWT session auth</div><div className="d">Bearer tokens, single active session</div></div>
                  </div>
                  <div className="stat">
                    <div className="ic"><svg viewBox="0 0 24 24" fill="none"><rect x="4" y="10" width="16" height="10" rx="2" stroke="#fff" strokeWidth="1.7" /><path d="M8 10V7a4 4 0 018 0v3" stroke="#fff" strokeWidth="1.7" /></svg></div>
                    <div><div className="t">Email OTP + TOTP</div><div className="d">Adaptive two-factor verification</div></div>
                  </div>
                  <div className="stat">
                    <div className="ic"><IconRoleAssigned stroke="#fff" /></div>
                    <div><div className="t">Role-based access</div><div className="d">Granular permissions per endpoint</div></div>
                  </div>
                </div>
              </div>
              <div>
                <div className="card card-pad" style={{ background: 'var(--surface-solid)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                    <div className="avatar avatar-md" style={{ background: 'var(--accent-gradient)' }}>JD</div>
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Jordan Diallo</div>
                      <div className="text-subtle" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>jordan@keystone.dev</div>
                    </div>
                    <span className="badge badge-success" style={{ marginLeft: 'auto', flexShrink: 0 }}><span className="badge-dot" />Active</span>
                  </div>
                  <div className="grid grid-2" style={{ gap: 10 }}>
                    <div className="stat-card card" style={{ padding: 14 }}>
                      <div className="val" style={{ fontSize: 20 }}>248</div>
                      <div className="lbl">Team members</div>
                    </div>
                    <div className="stat-card card" style={{ padding: 14 }}>
                      <div className="val" style={{ fontSize: 20 }}>12</div>
                      <div className="lbl">Roles configured</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="container">
          <div className="section-head">
            <div>
              <h3 style={{ fontSize: 26 }}>Every auth surface, one cohesive product</h3>
              <div className="sub">Built directly against your API&apos;s routes, nothing mocked.</div>
            </div>
          </div>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <div className="card feature fade-up" key={f.title}>
                <div className="ic">{f.icon}</div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="endpoints" className="container" style={{ paddingBlock: '40px 20px' }}>
          <div className="section-head">
            <div>
              <h3 style={{ fontSize: 22 }}>
                Talking directly to <span className="mono text-muted">/api/v1</span>
              </h3>
              <div className="sub">No mock data: every screen calls a real route on your backend.</div>
            </div>
          </div>
          <div className="endpoint-strip">
            {ENDPOINTS.map(([method, path]) => (
              <span className="endpoint-pill" key={`${method} ${path}`}>
                <b>{method}</b>&nbsp;{path}
              </span>
            ))}
          </div>
        </section>

        <section id="security" className="container">
          <div className="cta-band">
            <h3 style={{ fontSize: 26 }}>Point it at your API and sign up in seconds.</h3>
            <p style={{ maxWidth: 480, margin: '0 auto 26px' }}>
              Set <span className="mono">VITE_API_BASE</span> in your <span className="mono">.env</span> if your Laravel app isn&apos;t on <span className="mono">localhost:8000</span>, then start clicking.
            </p>
            <div className="actions" style={{ justifyContent: 'center' }}>
              <Link to="/register" className="btn btn-primary btn-lg">Create your account</Link>
              <Link to="/login" className="btn btn-secondary btn-lg">I already have one</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="foot container">
        <Logo />
        <div>Built for the laravel-auth-api project · not a production identity provider.</div>
      </footer>
    </>
  );
}
