import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { setChallenge } from '../lib/storage.js';
import { copyText } from '../lib/format.js';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import OtpInput from '../components/OtpInput.jsx';
import { IconAlert, IconCopy, IconPhone, IconShieldCheck, IconUser } from '../lib/icons.jsx';

export default function Security() {
  const { user, setUser } = useAuth();
  const { toastSuccess, toastError } = useToast();
  const navigate = useNavigate();

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState('scan');
  const [secret, setSecret] = useState('');
  const [qrHtml, setQrHtml] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [confirmCode, setConfirmCode] = useState(null);
  const [confirmError, setConfirmError] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const otpRef = useRef(null);

  const [confirmModal, setConfirmModal] = useState(null); // { title, body, action }
  const [confirmActionLoading, setConfirmActionLoading] = useState(false);

  const [codesModalOpen, setCodesModalOpen] = useState(false);
  const [newCodes, setNewCodes] = useState([]);

  const [phoneLoading, setPhoneLoading] = useState(false);
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [methodLoading, setMethodLoading] = useState(null); // null, or the target method being switched to

  if (!user) {
    return (
      <div style={{ maxWidth: 820 }}>
        <div className="skel" style={{ height: 100, marginBottom: 20 }} />
        <div className="skel" style={{ height: 100 }} />
      </div>
    );
  }

  async function startSetup() {
    setWizardStep('scan');
    setWizardOpen(true);
    setQrLoading(true);
    setQrHtml('');
    try {
      const { data } = await Api.twoFaSetup();
      setSecret(data.secret);
      const svg = await Api.twoFaQrSvg(data.secret);
      setQrHtml(svg);
    } catch (err) {
      setWizardOpen(false);
      toastError(err.message);
    } finally {
      setQrLoading(false);
    }
  }

  function goToConfirm() {
    setWizardStep('confirm');
    setConfirmError('');
    otpRef.current?.clear();
  }

  async function submitConfirm(code) {
    // Same double-submit guard as VerifyOtp: the OTP boxes auto-fire
    // onComplete, and the "Enable 2FA" button calls the same handler.
    if (confirmLoading) return;
    setConfirmError('');
    setConfirmLoading(true);
    try {
      const { data } = await Api.twoFaConfirm({ secret, code });
      setRecoveryCodes(data.recovery_codes);
      setWizardStep('codes');
      setUser({ ...user, two_fa: true, two_fa_method: 'authenticator_app', authenticator_configured: true });
    } catch (err) {
      setConfirmError(err.message);
    } finally {
      setConfirmLoading(false);
    }
  }

  function finishWizard() {
    setWizardOpen(false);
    toastSuccess('Authenticator app enabled.');
  }

  function askRegenerate() {
    setConfirmModal({
      title: 'Regenerate recovery codes?',
      body: 'Your existing recovery codes will stop working immediately.',
      action: async () => {
        const { data } = await Api.twoFaRegenerateCodes();
        setNewCodes(data.recovery_codes);
        setConfirmModal(null);
        setCodesModalOpen(true);
      },
    });
  }

  function askDisableTwoFa() {
    setConfirmModal({
      title: 'Turn off two-factor authentication?',
      body: 'Your account will only need a password to sign in. Any authenticator app setup is kept, so turning it back on later won’t require setting anything up again.',
      confirmLabel: 'Turn off',
      action: async () => {
        await Api.twoFaDisable();
        setUser({ ...user, two_fa: false });
        setConfirmModal(null);
        toastSuccess('Two-factor authentication turned off.');
      },
    });
  }

  async function enableTwoFa() {
    setTwoFaLoading(true);
    try {
      await Api.twoFaEnable();
      setUser({ ...user, two_fa: true });
      toastSuccess('Two-factor authentication turned on.');
    } catch (err) {
      toastError(err.message);
    } finally {
      setTwoFaLoading(false);
    }
  }

  async function chooseMethod(method) {
    if (method === user.two_fa_method) return;
    if (method === 'authenticator_app' && !authenticatorConfigured) {
      startSetup();
      return;
    }
    setMethodLoading(method);
    try {
      await Api.twoFaSwitchMethod(method);
      setUser({ ...user, two_fa_method: method });
      toastSuccess(method === 'authenticator_app' ? 'Switched to authenticator app.' : 'Switched to email codes.');
    } catch (err) {
      toastError(err.message);
    } finally {
      setMethodLoading(null);
    }
  }

  async function runConfirmModal() {
    if (!confirmModal) return;
    setConfirmActionLoading(true);
    try {
      await confirmModal.action();
    } catch (err) {
      toastError(err.message);
    } finally {
      setConfirmActionLoading(false);
    }
  }

  async function sendPhoneOtp() {
    setPhoneLoading(true);
    try {
      const { data } = await Api.sendPhoneOtp();
      setChallenge(data, 'phone_verification');
      navigate('/verify-otp');
    } catch (err) {
      toastError(err.message);
      setPhoneLoading(false);
    }
  }

  const authenticatorConfigured = !!user.authenticator_configured;
  const methodIsAuthenticator = user.two_fa_method === 'authenticator_app';

  return (
    <div style={{ maxWidth: 820 }}>
      <div className="card card-pad fade-up" style={{ marginBottom: 20 }}>
        <div className="section-head" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div className="stat-card ic" style={{ width: 46, height: 46, flexShrink: 0 }}>
              <IconShieldCheck width="22" height="22" />
            </div>
            <div>
              <h3 style={{ marginBottom: 4 }}>Two-factor authentication</h3>
              <div className="sub">
                {user.two_fa ? (
                  <>
                    <span className="badge badge-success" style={{ marginRight: 6 }}><span className="badge-dot" />Enabled</span>
                    A code is required at sign-in, sent by {methodIsAuthenticator ? 'your authenticator app' : 'email'}.
                  </>
                ) : (
                  <>
                    <span className="badge badge-neutral" style={{ marginRight: 6 }}>Disabled</span> Add a second step to protect your account.
                  </>
                )}
              </div>
            </div>
          </div>
          {user.two_fa ? (
            <Button variant="danger" size="sm" loading={twoFaLoading} onClick={askDisableTwoFa}>Turn off</Button>
          ) : (
            <Button variant="primary" size="sm" loading={twoFaLoading} onClick={enableTwoFa}>Turn on</Button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
          <span className="text-muted" style={{ fontSize: 13 }}>Method:</span>
          <Button
            variant={!methodIsAuthenticator ? 'primary' : 'secondary'}
            size="sm"
            loading={methodLoading === 'default'}
            onClick={() => chooseMethod('default')}
          >
            Email
          </Button>
          <Button
            variant={methodIsAuthenticator ? 'primary' : 'secondary'}
            size="sm"
            loading={methodLoading === 'authenticator_app'}
            onClick={() => chooseMethod('authenticator_app')}
          >
            Authenticator app
          </Button>
        </div>
      </div>

      <div className="card card-pad fade-up" style={{ marginBottom: 20 }}>
        <div className="section-head" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div className="stat-card ic" style={{ width: 46, height: 46, flexShrink: 0 }}>
              <IconShieldCheck width="22" height="22" />
            </div>
            <div>
              <h3 style={{ marginBottom: 4 }}>Authenticator app</h3>
              <div className="sub">
                {authenticatorConfigured ? (
                  <>
                    <span className="badge badge-success" style={{ marginRight: 6 }}><span className="badge-dot" />Configured</span> Scan a new QR code any time to replace it.
                  </>
                ) : (
                  <>
                    <span className="badge badge-neutral" style={{ marginRight: 6 }}>Not set up</span> Set one up to use it as your two-factor method.
                  </>
                )}
              </div>
            </div>
          </div>
          {authenticatorConfigured ? (
            <Button variant="secondary" size="sm" onClick={askRegenerate}>Regenerate codes</Button>
          ) : (
            <Button variant="primary" size="sm" onClick={startSetup}>Set up</Button>
          )}
        </div>
      </div>

      <div className="card card-pad fade-up" style={{ marginBottom: 20 }}>
        <div className="section-head" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div className="stat-card ic" style={{ width: 46, height: 46, flexShrink: 0 }}>
              <IconPhone width="22" height="22" />
            </div>
            <div>
              <h3 style={{ marginBottom: 4 }}>Phone verification</h3>
              <div className="sub">
                {user.phone_number ? (
                  <>
                    <span className={`badge badge-${user.phone_verified ? 'success' : 'neutral'}`} style={{ marginRight: 6 }}>
                      {user.phone_verified && <span className="badge-dot" />}
                      {user.phone_verified ? 'Verified' : 'Not verified'}
                    </span>
                    {user.phone_verified ? 'This number is verified.' : `Send a verification code to ${user.phone_number}.`}
                  </>
                ) : (
                  'Add a phone number in your profile first.'
                )}
              </div>
            </div>
          </div>
          <Button variant="secondary" size="sm" disabled={!user.phone_number || user.phone_verified} loading={phoneLoading} onClick={sendPhoneOtp}>Send code</Button>
        </div>
      </div>

      <div className="card card-pad fade-up">
        <div className="section-head" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div className="stat-card ic" style={{ width: 46, height: 46, flexShrink: 0 }}>
              <IconUser width="22" height="22" />
            </div>
            <div>
              <h3 style={{ marginBottom: 4 }}>Active session</h3>
              <div className="sub">Keystone keeps a single active session per account. Signing in elsewhere will sign this device out.</div>
            </div>
          </div>
        </div>
      </div>

      {/* TOTP setup wizard */}
      <Modal open={wizardOpen} onClose={() => setWizardOpen(false)} title="Set up authenticator app" maxWidth={400}>
        {wizardStep === 'scan' && (
          <div>
            <div className="steps"><div className="step done" /><div className="step active" /><div className="step" /></div>
            <p className="text-muted" style={{ fontSize: 13.5, marginBottom: 16 }}>Scan this QR code with Google Authenticator, Authy, or any TOTP app.</p>
            <div style={{ background: '#fff', borderRadius: 'var(--r-md)', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
              {qrLoading ? <div className="spinner spinner-dark" /> : <div dangerouslySetInnerHTML={{ __html: qrHtml }} />}
            </div>
            <div className="hint" style={{ margin: '12px 0 4px' }}>Can&apos;t scan? Enter this key manually:</div>
            <div className="input-wrap">
              <input className="input mono" readOnly value={secret} style={{ paddingRight: 44 }} />
              <button className="input-action" type="button" aria-label="Copy secret" onClick={() => copyText(secret).then((ok) => (ok ? toastSuccess('Copied to clipboard.') : toastError('Could not copy. Copy it manually.')))}>
                <IconCopy width="16" height="16" />
              </button>
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setWizardOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={goToConfirm} disabled={qrLoading || !secret}>Continue</Button>
            </div>
          </div>
        )}

        {wizardStep === 'confirm' && (
          <div>
            <div className="steps"><div className="step done" /><div className="step done" /><div className="step active" /></div>
            <p className="text-muted" style={{ fontSize: 13.5, marginBottom: 18 }}>Enter the 6-digit code currently shown in your app.</p>
            <div style={{ marginBottom: 6 }}>
              <OtpInput ref={otpRef} onComplete={(code) => { setConfirmCode(code); submitConfirm(code); }} />
            </div>
            {confirmError && (
              <div className="alert alert-danger" style={{ marginBottom: 14 }}>
                <IconAlert width="18" height="18" />
                <div>{confirmError}</div>
              </div>
            )}
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setWizardOpen(false)}>Cancel</Button>
              <Button variant="primary" loading={confirmLoading} onClick={() => otpRef.current && submitConfirm(otpRef.current.value())}>Enable 2FA</Button>
            </div>
          </div>
        )}

        {wizardStep === 'codes' && (
          <div>
            <div className="steps"><div className="step done" /><div className="step done" /><div className="step done" /></div>
            <div className="alert alert-warning" style={{ marginBottom: 16 }}>
              <IconAlert width="18" height="18" />
              <div>
                <strong>This is the only time we&apos;ll show these codes.</strong>
              </div>
            </div>
            <p className="text-muted" style={{ fontSize: 13.5, marginBottom: 14 }}>Save these recovery codes somewhere safe. Each can be used once if you lose access to your authenticator.</p>
            <div className="code-grid">
              {recoveryCodes.map((c) => (
                <div className="code" key={c}>{c}</div>
              ))}
            </div>
            <div className="modal-actions">
              <Button variant="secondary" type="button" onClick={() => copyText(recoveryCodes.join('\n')).then((ok) => (ok ? toastSuccess('Copied to clipboard.') : toastError('Could not copy.')))}>Copy all</Button>
              <Button variant="primary" onClick={finishWizard}>I&apos;ve saved these</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={confirmModal?.title}
        body={confirmModal?.body}
        confirmLabel={confirmModal?.confirmLabel}
        loading={confirmActionLoading}
        onConfirm={runConfirmModal}
      />

      <Modal open={codesModalOpen} onClose={() => setCodesModalOpen(false)} title="New recovery codes" maxWidth={380}>
        <p className="text-muted" style={{ fontSize: 13.5, marginBottom: 14 }}>Your previous recovery codes are now invalid.</p>
        <div className="code-grid">
          {newCodes.map((c) => (
            <div className="code" key={c}>{c}</div>
          ))}
        </div>
        <div className="modal-actions">
          <Button variant="secondary" type="button" onClick={() => copyText(newCodes.join('\n')).then((ok) => (ok ? toastSuccess('Copied to clipboard.') : toastError('Could not copy.')))}>Copy all</Button>
          <Button variant="primary" onClick={() => setCodesModalOpen(false)}>Done</Button>
        </div>
      </Modal>
    </div>
  );
}
