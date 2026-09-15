import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Api } from '../api/client.js';
import { useAsyncForm } from '../lib/useAsyncForm.js';
import AuthLayout from '../components/AuthLayout.jsx';
import FormField, { PasswordMeter } from '../components/FormField.jsx';
import Button from '../components/Button.jsx';
import { IconAlert } from '../lib/icons.jsx';

export default function ActivateAccount() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [form, setForm] = useState({ password: '', password_confirmation: '' });

  function field(name) {
    return { value: form[name], onChange: (e) => setForm((f) => ({ ...f, [name]: e.target.value })) };
  }

  const { loading, fieldErrors, submit } = useAsyncForm(async () => {
    if (!token) return;
    await Api.activateAccount({ token, password: form.password, password_confirmation: form.password_confirmation });
    navigate('/login?activated=1');
  });

  return (
    <AuthLayout maxWidth={432}>
      <h1>Activate your account</h1>
      <p className="lede">An administrator created an account for you. Set a password to finish activating it.</p>

      {!token && (
        <div className="alert alert-danger" style={{ marginBottom: 20 }}>
          <IconAlert width="18" height="18" />
          <div>Missing activation token. Open the link from your invitation email.</div>
        </div>
      )}

      <div className="card card-glow card-pad">
        <form onSubmit={submit} noValidate autoComplete="off">
          <FormField id="password" label="Password" password autoComplete="off" required {...field('password')} error={fieldErrors.password} />
          <PasswordMeter password={form.password} style={{ margin: '-14px 0 20px' }} />
          <FormField id="password_confirmation" label="Confirm password" password autoComplete="off" required {...field('password_confirmation')} error={fieldErrors.password_confirmation} />
          <Button type="submit" variant="primary" size="lg" className="btn-block" loading={loading}>
            Activate account
          </Button>
        </form>
      </div>

      <div className="auth-foot">
        <Link to="/login">&larr; Back to sign in</Link>
      </div>
    </AuthLayout>
  );
}
