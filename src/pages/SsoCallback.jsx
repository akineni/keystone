import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import { IconCheck, IconX } from '../lib/icons.jsx';

export default function SsoCallback() {
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const exchangedRef = useRef(false);

  useEffect(() => {
    // The backend redirects here with the exchange code as a URL fragment
    // (#code=...), or appended with & if our success_url already had one.
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const queryParams = new URLSearchParams(window.location.search);
    const code = hashParams.get('code') || queryParams.get('code');

    if (!code) {
      setState('nocode');
      return;
    }

    // StrictMode runs effects twice in dev; the exchange code is single-use,
    // so a second real call would always fail as "expired". Guard against it.
    if (exchangedRef.current) return;
    exchangedRef.current = true;

    (async () => {
      try {
        const { data } = await Api.ssoExchange(code);
        setSession(data);
        setState('success');
        setTimeout(() => navigate('/dashboard'), 700);
      } catch (err) {
        setErrorMsg(err.message || 'That code has expired or was already used.');
        setState('error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthLayout maxWidth={380}>
      <div className="center">
        {state === 'loading' && (
          <>
            <div className="spinner spinner-dark" style={{ width: 34, height: 34, borderWidth: 3, margin: '0 auto 22px' }} />
            <h1 style={{ fontSize: 20 }}>Completing sign-in&hellip;</h1>
            <p className="lede">Exchanging your provider code for a Keystone session.</p>
          </>
        )}
        {state === 'success' && (
          <>
            <div className="mark" style={{ width: 52, height: 52, borderRadius: 16, margin: '0 auto 20px', display: 'flex' }}>
              <IconCheck style={{ margin: 'auto' }} width="24" height="24" stroke="#fff" strokeWidth="2.4" />
            </div>
            <h1 style={{ fontSize: 20 }}>You&apos;re in.</h1>
            <p className="lede">Redirecting to your dashboard&hellip;</p>
          </>
        )}
        {(state === 'nocode' || state === 'error') && (
          <>
            <div className="mark" style={{ width: 52, height: 52, borderRadius: 16, margin: '0 auto 20px', display: 'flex', background: 'var(--danger-bg)' }}>
              <IconX style={{ margin: 'auto', color: '#f87171' }} width="24" height="24" />
            </div>
            <h1 style={{ fontSize: 20 }}>{state === 'nocode' ? 'No authorization code found' : 'Sign-in failed'}</h1>
            <p className="lede">{state === 'nocode' ? "This page expects to be reached from your identity provider's redirect." : errorMsg}</p>
            <Link to="/login" className="btn btn-primary btn-block">
              {state === 'nocode' ? 'Back to sign in' : 'Try again'}
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
