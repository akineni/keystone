import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { setChallenge } from '../lib/storage.js';
import { absoluteUrl } from '../lib/url.js';
import { useAsyncForm } from '../lib/useAsyncForm.js';
import { useToast } from '../context/ToastContext.jsx';
import AuthLayout, { AuthVisual } from '../components/AuthLayout.jsx';
import FormField from '../components/FormField.jsx';
import Button from '../components/Button.jsx';
import { IconArrowRight, IconLock, IconMail, IconShield, IconShieldCheck, GoogleG, FacebookF } from '../lib/icons.jsx';

export default function Login() {
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toastError } = useToast();
  const [form, setForm] = useState({ login: '', password: '' });
  const [alert, setAlert] = useState(initialAlert(params));
  const [ssoLoading, setSsoLoading] = useState(null);

  const { loading, fieldErrors, submit } = useAsyncForm(async () => {
    setAlert(null);
    try {
      const { data } = await Api.login({ login: form.login, password: form.password });
      if (data.access_token) {
        setSession(data);
        const redirect = params.get('redirect');
        navigate(redirect && !redirect.includes('login') ? `/${redirect.replace(/^\/+/, '')}` : '/dashboard');
      } else if (data.otp_required) {
        setChallenge(data, 'login');
        navigate('/verify-otp');
      }
    } catch (err) {
      if (err.status === 423) setAlert({ type: 'warning', message: err.message });
      else if (err.status === 403) setAlert({ type: 'danger', message: err.message });
      else if (err.status === 401) setAlert({ type: 'danger', message: err.message || 'Invalid credentials.' });
      else throw err;
    }
  });

  async function handleSso(provider) {
    setSsoLoading(provider);
    try {
      const successUrl = absoluteUrl('sso-callback');
      const { data } = await Api.ssoUrl(provider, successUrl);
      window.location.href = data.auth_url;
    } catch (err) {
      toastError(err.message);
      setSsoLoading(null);
    }
  }

  return (
    <AuthLayout
      visual={
        <AuthVisual
          quote="Locking this down took an afternoon, not a sprint."
          quoteSub="Every team that wires up Keystone against their own API says some version of this."
          stats={[
            { icon: <IconShield />, title: 'Single active session', desc: 'New sign-ins revoke stale tokens automatically' },
            { icon: <IconShieldCheck />, title: 'Lockout after 5 attempts', desc: '15 minute cool-down protects every account' },
          ]}
        />
      }
    >
      <h1>Sign in to Keystone</h1>
      <p className="lede">Use your email or username. We&apos;ll ask for a one-time code too, if you&apos;ve turned on extra verification.</p>

      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ marginBottom: 20 }}>
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A1.5 1.5 0 003.52 20h16.96a1.5 1.5 0 001.41-2L13.71 3.86a1.5 1.5 0 00-2.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <div>{alert.message}</div>
        </div>
      )}

      <div className="card card-glow card-pad">
        <form onSubmit={submit} noValidate autoComplete="off">
          <FormField
            id="login"
            label="Email or username"
            icon={<IconMail />}
            autoComplete="off"
            required
            value={form.login}
            onChange={(e) => setForm((f) => ({ ...f, login: e.target.value }))}
            error={fieldErrors.login}
          />
          <div style={{ position: 'relative' }}>
            <FormField
              id="password"
              label="Password"
              icon={<IconLock />}
              password
              autoComplete="off"
              required
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              error={fieldErrors.password}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '-10px 0 20px' }}>
            <Link to="/forgot-password" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent)' }}>
              Forgot password?
            </Link>
          </div>
          <Button type="submit" variant="primary" size="lg" className="btn-block" loading={loading}>
            Sign in
            <IconArrowRight width="16" height="16" />
          </Button>
        </form>

        <div className="auth-divider">or continue with</div>
        <div className="oauth-row">
          <Button type="button" variant="secondary" loading={ssoLoading === 'google'} disabled={!!ssoLoading} onClick={() => handleSso('google')}>
            <GoogleG /> Google
          </Button>
          <Button type="button" variant="secondary" loading={ssoLoading === 'facebook'} disabled={!!ssoLoading} onClick={() => handleSso('facebook')}>
            <FacebookF /> Facebook
          </Button>
        </div>
      </div>

      <div className="auth-foot">
        New to Keystone? <Link to="/register">Create an account</Link>
      </div>

      <div className="trust-strip">
        <div className="item"><IconShield width="14" height="14" />JWT-secured</div>
        <div className="item"><IconLock width="14" height="14" />2FA ready</div>
        <div className="item"><svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" /></svg>Rate limited</div>
      </div>
    </AuthLayout>
  );
}

function initialAlert(params) {
  if (params.get('reset') === '1') return { type: 'success', message: 'Your password was reset. Sign in with your new password.' };
  if (params.get('activated') === '1') return { type: 'success', message: 'Your account is active. Sign in to continue.' };
  if (params.get('verified') === '1') return { type: 'success', message: 'Email verified. Sign in to continue.' };
  return null;
}
