import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Api } from '../api/client.js';
import { setChallenge } from '../lib/storage.js';
import { useAsyncForm } from '../lib/useAsyncForm.js';
import AuthLayout, { AuthVisual } from '../components/AuthLayout.jsx';
import FormField, { PasswordMeter, SelectField } from '../components/FormField.jsx';
import Button from '../components/Button.jsx';
import { IconArrowRight, IconMail, IconShield } from '../lib/icons.jsx';

const initialForm = {
  firstname: '',
  lastname: '',
  email: '',
  username: '',
  phone_number: '',
  gender: '',
  password: '',
  password_confirmation: '',
};

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [suggestions, setSuggestions] = useState(null);

  function field(name) {
    return { value: form[name], onChange: (e) => setForm((f) => ({ ...f, [name]: e.target.value })) };
  }

  const { loading, fieldErrors, submit } = useAsyncForm(async () => {
    setSuggestions(null);
    const payload = { ...form };
    if (!payload.username) delete payload.username;
    if (!payload.phone_number) delete payload.phone_number;
    if (!payload.gender) delete payload.gender;

    try {
      const { data } = await Api.register(payload);
      setChallenge(data, 'email_verification');
      navigate('/verify-otp');
    } catch (err) {
      if (err.meta?.username_suggestions) setSuggestions(err.meta.username_suggestions);
      throw err;
    }
  });

  return (
    <AuthLayout
      maxWidth={472}
      visual={
        <AuthVisual
          quote="Set up in minutes."
          quoteSub="Your new account gets a verification email the moment you submit this form."
          stats={[
            { icon: <IconMail />, title: 'Strong passwords enforced', desc: 'Mixed case, numbers, and symbols, checked against breach lists' },
            { icon: <IconShield />, title: 'Email verification required', desc: 'A 6-digit code confirms it’s really you' },
          ]}
        />
      }
    >
      <h1>Create your account</h1>
      <p className="lede">It takes a minute, then we&apos;ll email you a code to verify your address.</p>

      <div className="card card-glow card-pad">
        <form onSubmit={submit} noValidate autoComplete="off">
          <div className="field-row">
            <FormField id="firstname" label="First name" autoComplete="off" required {...field('firstname')} error={fieldErrors.firstname} />
            <FormField id="lastname" label="Last name" autoComplete="off" required {...field('lastname')} error={fieldErrors.lastname} />
          </div>

          <FormField id="email" label="Email address" type="email" icon={<IconMail />} autoComplete="off" required {...field('email')} error={fieldErrors.email} />

          <FormField id="username" label="Username" optional autoComplete="off" {...field('username')} error={fieldErrors.username} />
          {suggestions && (
            <div className="hint" style={{ margin: '-14px 0 20px' }}>
              Try:{' '}
              {suggestions.map((s) => (
                <a
                  key={s}
                  href="#"
                  className="mono"
                  style={{ color: 'var(--accent)', marginRight: 8 }}
                  onClick={(e) => {
                    e.preventDefault();
                    setForm((f) => ({ ...f, username: s }));
                  }}
                >
                  {s}
                </a>
              ))}
            </div>
          )}

          <div className="field-row">
            <FormField id="phone_number" label="Phone" type="tel" optional autoComplete="off" hint="Country code, no leading 0 or +, e.g. 2348012345678" {...field('phone_number')} error={fieldErrors.phone_number} />
            <SelectField id="gender" label="Gender" {...field('gender')} error={fieldErrors.gender}>
              <option value=""></option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </SelectField>
          </div>

          <FormField id="password" label="Password" password autoComplete="off" required {...field('password')} error={fieldErrors.password} />
          <PasswordMeter password={form.password} style={{ margin: '-14px 0 8px' }} />
          <div className="hint" style={{ marginBottom: 20 }}>At least 8 characters, upper &amp; lower case, a number and a symbol.</div>

          <FormField id="password_confirmation" label="Confirm password" password autoComplete="off" required {...field('password_confirmation')} error={fieldErrors.password_confirmation} />

          <Button type="submit" variant="primary" size="lg" className="btn-block" loading={loading}>
            Create account
            <IconArrowRight width="16" height="16" />
          </Button>
        </form>
      </div>

      <div className="auth-foot">
        Already have an account? <Link to="/login">Sign in</Link>
      </div>
    </AuthLayout>
  );
}
