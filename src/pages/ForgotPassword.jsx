import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Api } from '../api/client.js';
import { setChallenge } from '../lib/storage.js';
import { useAsyncForm } from '../lib/useAsyncForm.js';
import AuthLayout from '../components/AuthLayout.jsx';
import FormField from '../components/FormField.jsx';
import Button from '../components/Button.jsx';
import { IconArrowLeft, IconCheck, IconMail } from '../lib/icons.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(null);
  const [challengeSet, setChallengeSet] = useState(false);
  const navigate = useNavigate();

  const { loading, fieldErrors, submit } = useAsyncForm(async () => {
    const { data, message } = await Api.forgotPassword({ email });
    if (data && data.otp_required) {
      setChallenge(data, 'password_reset');
      setChallengeSet(true);
      navigate('/verify-otp');
      return;
    }
    setSent(message);
  });

  return (
    <AuthLayout maxWidth={432}>
      <Link to="/login" className="back-link">
        <IconArrowLeft width="15" height="15" />
        Back to sign in
      </Link>
      <h1>Forgot your password?</h1>
      <p className="lede">Enter the email on your account and we&apos;ll send you a link to set a new one.</p>

      {sent && (
        <div className="alert alert-success">
          <IconCheck />
          <div>
            <strong>Check your inbox.</strong>
            <br />
            {sent}
          </div>
        </div>
      )}

      {!sent && !challengeSet && (
        <div className="card card-glow card-pad">
          <form onSubmit={submit} noValidate autoComplete="off">
            <FormField id="email" label="Email address" type="email" icon={<IconMail />} autoComplete="off" required value={email} onChange={(e) => setEmail(e.target.value)} error={fieldErrors.email} />
            <Button type="submit" variant="primary" size="lg" className="btn-block" loading={loading}>
              Send reset link
            </Button>
          </form>
        </div>
      )}

      <div className="auth-foot">
        Remembered it? <Link to="/login">Sign in instead</Link>
      </div>
    </AuthLayout>
  );
}
