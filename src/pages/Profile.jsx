import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { setFlash } from '../lib/storage.js';
import { useAsyncForm } from '../lib/useAsyncForm.js';
import Avatar from '../components/Avatar.jsx';
import Button from '../components/Button.jsx';
import FormField, { PasswordMeter, SelectField } from '../components/FormField.jsx';

const emptyProfile = { firstname: '', lastname: '', phone_number: '', gender: '', state: '', country: '', address: '', postcode: '' };

export default function Profile() {
  const { user, setUser, clearSession } = useAuth();
  const { toastSuccess, toastError } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('info');
  const [profile, setProfile] = useState(emptyProfile);
  const [pendingAvatar, setPendingAvatar] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    setProfile({
      firstname: user.firstname || '',
      lastname: user.lastname || '',
      phone_number: user.phone_number || '',
      gender: user.gender || '',
      state: user.state || '',
      country: user.country || '',
      address: user.address || '',
      postcode: user.postcode || '',
    });
  }, [user]);

  function field(name) {
    return { value: profile[name], onChange: (e) => setProfile((f) => ({ ...f, [name]: e.target.value })) };
  }

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toastError('Image must be under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPendingAvatar(reader.result);
    reader.readAsDataURL(file);
  }

  const profileForm = useAsyncForm(async () => {
    const payload = { ...profile };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === '') delete payload[k];
    });
    if (pendingAvatar) payload.avatar = pendingAvatar;
    const { data } = await Api.updateMe(payload);
    setUser(data);
    setPendingAvatar(null);
    toastSuccess('Your profile has been updated.');
  });

  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
  const passwordForm = useAsyncForm(async () => {
    if (pwForm.new_password !== pwForm.new_password_confirmation) {
      passwordForm.setFieldErrors({ new_password_confirmation: 'Passwords do not match.' });
      return;
    }
    await Api.changeMyPassword(pwForm);
    clearSession();
    setFlash({ type: 'success', title: 'Password updated', msg: 'Sign in again with your new password.' });
    navigate('/login');
  });

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="tabs">
        <div className={`tab${tab === 'info' ? ' active' : ''}`} onClick={() => setTab('info')}>Profile information</div>
        <div className={`tab${tab === 'password' ? ' active' : ''}`} onClick={() => setTab('password')}>Password</div>
      </div>

      {tab === 'info' && (
        <div className="card card-glow card-pad fade-up">
          <div className="section-head" style={{ marginBottom: 22 }}>
            <div>
              <h3>Profile photo &amp; details</h3>
              <div className="sub">This information may be visible to your team.</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 28 }}>
            <div style={{ position: 'relative' }}>
              {pendingAvatar ? <div className="avatar avatar-xl" style={{ backgroundImage: `url('${pendingAvatar}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} /> : <Avatar user={user} size="xl" />}
            </div>
            <div>
              <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>Change photo</Button>
              <div className="hint" style={{ marginTop: 8 }}>PNG or JPG, up to 5MB.</div>
            </div>
          </div>

          <form onSubmit={profileForm.submit} noValidate>
            <div className="field-row">
              <FormField id="firstname" label="First name" required {...field('firstname')} error={profileForm.fieldErrors.firstname} />
              <FormField id="lastname" label="Last name" required {...field('lastname')} error={profileForm.fieldErrors.lastname} />
            </div>
            <FormField id="emailDisplay" label="Email address" type="email" value={user?.email || ''} disabled readOnly />
            <div className="hint" style={{ margin: '-14px 0 20px' }}>Email changes aren&apos;t self-serve here. Contact an administrator.</div>
            <div className="field-row">
              <FormField id="phone_number" label="Phone number" type="tel" hint="Include your country code, no leading 0 or +, e.g. 2348012345678" {...field('phone_number')} error={profileForm.fieldErrors.phone_number} />
              <SelectField id="gender" label="Gender" {...field('gender')} error={profileForm.fieldErrors.gender}>
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </SelectField>
            </div>
            <div className="field-row">
              <FormField id="state" label="State" {...field('state')} error={profileForm.fieldErrors.state} />
              <FormField id="country" label="Country" {...field('country')} error={profileForm.fieldErrors.country} />
            </div>
            <div className="field-row">
              <FormField id="address" label="Address" {...field('address')} error={profileForm.fieldErrors.address} />
              <FormField id="postcode" label="Postcode" {...field('postcode')} error={profileForm.fieldErrors.postcode} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <Button type="submit" variant="primary" loading={profileForm.loading}>Save changes</Button>
            </div>
          </form>
        </div>
      )}

      {tab === 'password' && (
        <div className="card card-glow card-pad fade-up" style={{ maxWidth: 480 }}>
          <div className="section-head" style={{ marginBottom: 22 }}>
            <div>
              <h3>Change password</h3>
              <div className="sub">You&apos;ll be signed out on every device after this.</div>
            </div>
          </div>
          <form onSubmit={passwordForm.submit} noValidate>
            <FormField
              id="current_password"
              label="Current password"
              password
              autoComplete="current-password"
              required
              value={pwForm.current_password}
              onChange={(e) => setPwForm((f) => ({ ...f, current_password: e.target.value }))}
              error={passwordForm.fieldErrors.current_password}
            />
            <FormField
              id="new_password"
              label="New password"
              password
              autoComplete="new-password"
              required
              value={pwForm.new_password}
              onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))}
              error={passwordForm.fieldErrors.new_password}
            />
            <PasswordMeter password={pwForm.new_password} style={{ margin: '-14px 0 20px' }} />
            <FormField
              id="new_password_confirmation"
              label="Confirm new password"
              password
              autoComplete="new-password"
              required
              value={pwForm.new_password_confirmation}
              onChange={(e) => setPwForm((f) => ({ ...f, new_password_confirmation: e.target.value }))}
              error={passwordForm.fieldErrors.new_password_confirmation}
            />
            <Button type="submit" variant="primary" className="btn-block" loading={passwordForm.loading}>Update password</Button>
          </form>
        </div>
      )}
    </div>
  );
}
