export default function Button({ variant = 'primary', size, loading, className = '', children, ...props }) {
  const cls = ['btn', `btn-${variant}`, size && `btn-${size}`, loading && 'is-loading', className].filter(Boolean).join(' ');
  return (
    <button className={cls} disabled={loading || props.disabled} {...props}>
      {children}
      {loading && <span className="spinner" />}
    </button>
  );
}
