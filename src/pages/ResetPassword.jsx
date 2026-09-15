import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Api } from '../api/client.js';
import { useAsyncForm } from '../lib/useAsyncForm.js';
import AuthLayout from '../components/AuthLayout.jsx';
import FormField, { PasswordMeter } from '../components/FormField.jsx';
import Button from '../components/Button.jsx';
import { IconAlert } from '../lib/icons.jsx';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [form, setForm] = useState({ email: params.get('email') || '', password: '', password_confirmation: '' });
  const [alert, setAlert] = useState(null);

  function field(name) {
    return { value: form[name], onChange: (e) => setForm((f) => ({ ...f, [name]: e.target.value })) };
  }

  const { loading, fieldErrors, submit } = useAsyncForm(async () => {
    setAlert(null);
    if (!token) {
      setAlert({ message: 'Missing reset token. Request a new link from the forgot-password page.', showLink: false });
      return;
    }
    try {
      await Api.resetPassword({ email: form.email, token, password: form.password, password_confirmation: form.password_confirmation });
      navigate('/login?reset=1');
    } catch (err) {
      if (err.status === 400) {
        setAlert({ message: err.message, showLink: true });
        return;
      }
      throw err;
    }
  });

  return (
    <AuthLayout maxWidth={432}>
      <h1>Set a new password</h1>
      <p className="lede">
        {token ? "Choose something strong you haven't used before." : 'We could not find a reset token in this link. Open the button from your password-reset email, or enter your token/email below if you have them.'}
      </p>

      {alert && (
        <div className="alert alert-danger">
          <IconAlert width="18" height="18" />
          <div>
            {alert.message}
            {alert.showLink && (
              <>
                {' '}
                <Link to="/forgot-password" style={{ color: '#fff', textDecoration: 'underline' }}>
                  Request a new link
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <div className="card card-glow card-pad">
        <form onSubmit={submit} noValidate autoComplete="off">
          <FormField id="email" label="Email address" type="email" autoComplete="off" required {...field('email')} error={fieldErrors.email} />
          <FormField id="password" label="New password" password autoComplete="off" required {...field('password')} error={fieldErrors.password} />
          <PasswordMeter password={form.password} style={{ margin: '-14px 0 20px' }} />
          <FormField id="password_confirmation" label="Confirm new password" password autoComplete="off" required {...field('password_confirmation')} error={fieldErrors.password_confirmation} />
          <Button type="submit" variant="primary" size="lg" className="btn-block" loading={loading}>
            Reset password
          </Button>
        </form>
      </div>

      <div className="auth-foot">
        <Link to="/login">&larr; Back to sign in</Link>
      </div>
    </AuthLayout>
  );
}
