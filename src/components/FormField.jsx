import { cloneElement, useState } from 'react';
import { IconAlert, IconEye } from '../lib/icons.jsx';

export default function FormField({ id, name, label, type = 'text', icon, error, hint, optional, password, className = '', ...inputProps }) {
  const [visible, setVisible] = useState(false);
  const actualType = password ? (visible ? 'text' : 'password') : type;

  return (
    <div className={`field-float${icon ? ' has-icon' : ''}${className ? ' ' + className : ''}`}>
      {icon && cloneElement(icon, { className: 'field-icon' })}
      <input
        className={`input-float${error ? ' has-error' : ''}`}
        id={id}
        name={name || id}
        type={actualType}
        placeholder=" "
        style={password ? { paddingRight: 46 } : undefined}
        {...inputProps}
      />
      <label htmlFor={id}>
        {label}
        {optional && <span className="optional"> (optional)</span>}
      </label>
      {password && (
        <button type="button" className="input-action" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Hide password' : 'Show password'}>
          <IconEye open={visible} />
        </button>
      )}
      {error && (
        <div className="error-text">
          <IconAlert width="13" height="13" />
          <span>{error}</span>
        </div>
      )}
      {hint && !error && <div className="hint">{hint}</div>}
    </div>
  );
}

export function SelectField({ id, name, label, error, className = '', children, ...selectProps }) {
  return (
    <div className={`field-float select-field${className ? ' ' + className : ''}`}>
      <select className={`input-float${error ? ' has-error' : ''}`} id={id} name={name || id} {...selectProps}>
        {children}
      </select>
      <label htmlFor={id}>{label}</label>
      {error && (
        <div className="error-text">
          <IconAlert width="13" height="13" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export function PasswordMeter({ password, style }) {
  const score = scorePassword(password);
  return (
    <div className="pw-meter" data-score={score} style={style}>
      <i />
      <i />
      <i />
      <i />
    </div>
  );
}

function scorePassword(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}
