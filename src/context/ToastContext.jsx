import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { IconAlert, IconCheck, IconInfo, IconX } from '../lib/icons.jsx';

const ToastContext = createContext(null);

let idSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 180);
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const toast = useCallback(
    ({ type = 'info', title, message, duration = 4200 }) => {
      const id = ++idSeq;
      setToasts((list) => [...list, { id, type, title, message }]);
      if (duration) {
        const timer = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }
      return id;
    },
    [dismiss]
  );

  const toastSuccess = useCallback((message, title = 'Success') => toast({ type: 'success', title, message }), [toast]);
  const toastError = useCallback((message, title = 'Something went wrong') => toast({ type: 'error', title, message }), [toast]);
  const toastInfo = useCallback((message, title) => toast({ type: 'info', title, message }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, toastSuccess, toastError, toastInfo }}>
      {children}
      <div className="toast-region" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}${t.leaving ? ' leaving' : ''}`}>
            {t.type === 'success' ? <IconCheck /> : t.type === 'error' ? <IconAlert /> : <IconInfo />}
            <div className="body">
              {t.title && <div className="title">{t.title}</div>}
              {t.message && <div className="msg">{t.message}</div>}
            </div>
            <button className="close" aria-label="Dismiss" onClick={() => dismiss(t.id)}>
              <IconX />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
