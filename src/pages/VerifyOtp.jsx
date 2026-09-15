import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { clearChallenge, getChallenge, setChallenge, setFlash } from '../lib/storage.js';
import AuthLayout from '../components/AuthLayout.jsx';
import Button from '../components/Button.jsx';
import OtpInput from '../components/OtpInput.jsx';
import { IconAlert, IconLock } from '../lib/icons.jsx';

const COPY = {
  login: (destination) => ['Enter your verification code', destination ? `We sent a 6-digit code to ${destination}.` : 'Enter the 6-digit code from your authenticator app.'],
  email_verification: (destination) => ['Verify your email', `We sent a 6-digit code to ${destination || 'your inbox'}. Enter it below to activate your account.`],
  phone_verification: (destination) => ['Verify your phone', `We sent a 6-digit code to ${destination || 'your phone'}.`],
  password_reset: (destination) => ['Verify your identity', `We sent a 6-digit code to ${destination || 'your inbox'} to confirm your password reset.`],
};

export default function VerifyOtp() {
  const [challenge, setLocalChallenge] = useState(() => getChallenge());
  const { setSession, isAuthed } = useAuth();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const otpRef = useRef(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!challenge) {
    return (
      <AuthLayout maxWidth={420}>
        <div className="center">
          <div className="mark" style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 22px', display: 'flex', background: 'var(--danger-bg)' }}>
            <IconAlert style={{ color: '#f87171', margin: 'auto' }} width="24" height="24" />
          </div>
          <h1>No verification in progress</h1>
          <p className="lede">Start from sign in or create an account, and we&apos;ll bring you back here with a fresh code.</p>
          <Link to="/login" className="btn btn-primary btn-block btn-lg">
            Go to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  const [heading, subcopy] = (COPY[challenge.context] || COPY.login)(challenge.destination);
  const isAuthenticatorChallenge = challenge.context === 'login' && !challenge.destination;

  async function handleComplete(code) {
    // Guards against a double-submit race: the OTP boxes auto-fire onComplete
    // as soon as the 6th digit lands, and the "Verify" button calls the same
    // handler, and both can fire within the same instant.
    if (loading) return;
    setAlert(null);
    setLoading(true);
    try {
      const { data, message } = await Api.verifyOtp({ challenge_token: challenge.challenge_token, otp: code });
      clearChallenge();
      if (challenge.context === 'login') {
        setSession(data);
        setFlash({ type: 'success', title: 'Welcome back', msg: 'Signed in successfully.' });
        navigate('/dashboard');
      } else if (challenge.context === 'email_verification') {
        setFlash({ type: 'success', title: 'Email verified', msg: message });
        navigate('/login?verified=1');
      } else if (challenge.context === 'phone_verification') {
        setFlash({ type: 'success', title: 'Phone verified', msg: message });
        navigate(isAuthed ? '/security' : '/login');
      } else if (challenge.context === 'password_reset') {
        navigate(`/reset-password?token=${encodeURIComponent(data.token)}&email=${encodeURIComponent(data.email)}`);
      } else {
        navigate('/login');
      }
    } catch (err) {
      otpRef.current?.clear();
      setAlert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      const { data, message } = await Api.resendOtp({ challenge_token: challenge.challenge_token });
      setChallenge(data, challenge.context);
      setLocalChallenge(getChallenge());
      setCooldown(120);
    } catch (err) {
      setAlert(err.message);
    }
  }

  return (
    <AuthLayout maxWidth={440}>
      <div className="center">
        <div className="mark" style={{ width: 60, height: 60, borderRadius: 18, margin: '0 auto 24px', display: 'flex', boxShadow: 'var(--shadow-glow)' }}>
          <IconLock style={{ margin: 'auto' }} width="28" height="28" stroke="#fff" />
        </div>
        <h1>{heading}</h1>
        <p className="lede">{subcopy}</p>

        {alert && (
          <div className="alert alert-danger" style={{ marginBottom: 20 }}>
            <IconAlert width="18" height="18" />
            <div>{alert}</div>
          </div>
        )}

        <div className="card card-glow card-pad">
          <div className="field" style={{ marginBottom: 24 }}>
            <OtpInput ref={otpRef} onComplete={handleComplete} />
          </div>
          <Button type="button" variant="primary" size="lg" className="btn-block" loading={loading} onClick={() => otpRef.current && handleComplete(otpRef.current.value())}>
            Verify &amp; continue
          </Button>

          <div className="auth-foot" style={{ marginTop: 20 }}>
            {isAuthenticatorChallenge ? (
              <span className="text-subtle">Codes refresh automatically every 30 seconds in your app.</span>
            ) : (
              <>
                Didn&apos;t get a code?{' '}
                {cooldown > 0 ? (
                  <span className="text-subtle">available in {cooldown}s</span>
                ) : (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleResend();
                    }}
                  >
                    Resend
                  </a>
                )}
              </>
            )}
          </div>
        </div>

        <div className="auth-foot">
          <Link to="/login">&larr; Back to sign in</Link>
        </div>
      </div>
    </AuthLayout>
  );
}
