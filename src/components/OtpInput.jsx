import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

const OtpInput = forwardRef(function OtpInput({ length = 6, onComplete, autoFocus = true }, ref) {
  const [digits, setDigits] = useState(() => Array(length).fill(''));
  const inputs = useRef([]);

  useImperativeHandle(ref, () => ({
    value: () => digits.join(''),
    clear: () => {
      setDigits(Array(length).fill(''));
      inputs.current[0]?.focus();
    },
    focusFirst: () => inputs.current[0]?.focus(),
  }));

  // Centralizing the "all filled" check here (rather than calling onComplete
  // from inside a setDigits updater) avoids updating the parent component
  // while this one is still mid-render/mid-commit.
  useEffect(() => {
    const joined = digits.join('');
    if (joined.length === length && digits.every((d) => d)) onComplete?.(joined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  function handleChange(i, e) {
    const v = e.target.value.replace(/\D/g, '').slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
    if (v && inputs.current[i + 1]) inputs.current[i + 1].focus();
  }

  function handleKeyDown(i, e) {
    if (e.key === 'Backspace' && !digits[i] && inputs.current[i - 1]) inputs.current[i - 1].focus();
  }

  function handlePaste(e) {
    e.preventDefault();
    const text = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, length);
    if (!text) return;
    const next = Array(length).fill('');
    text.split('').forEach((ch, idx) => {
      next[idx] = ch;
    });
    setDigits(next);
    inputs.current[Math.min(text.length, length - 1)]?.focus();
  }

  return (
    <div className="otp-row">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          value={d}
          inputMode="numeric"
          maxLength={1}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          autoFocus={autoFocus && i === 0}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
});

export default OtpInput;
