import { useCallback, useState } from 'react';
import { useToast } from '../context/ToastContext.jsx';

/**
 * Wires an async submit handler with loading state + field-error mapping,
 * mirroring the vanilla-JS bindForm() helper from the static build.
 */
export function useAsyncForm(handler) {
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const { toastError } = useToast();

  const submit = useCallback(
    async (e, ...args) => {
      if (e && e.preventDefault) e.preventDefault();
      if (loading) return;
      setFieldErrors({});
      setLoading(true);
      try {
        await handler(...args);
      } catch (err) {
        if (err && err.errors) {
          const mapped = {};
          Object.entries(err.errors).forEach(([k, v]) => {
            mapped[k] = Array.isArray(v) ? v[0] : v;
          });
          setFieldErrors(mapped);
          toastError(err.message || 'Please check the highlighted fields.');
        } else {
          toastError((err && err.message) || 'Unexpected error occurred.');
        }
      } finally {
        setLoading(false);
      }
    },
    [handler, loading, toastError]
  );

  return { loading, fieldErrors, setFieldErrors, submit };
}
