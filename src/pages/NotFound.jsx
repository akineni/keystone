import { Link } from 'react-router-dom';
import Ambient from '../components/Ambient.jsx';

export default function NotFound() {
  return (
    <>
      <Ambient />
      <div className="auth-shell" style={{ gridTemplateColumns: '1fr' }}>
        <div className="auth-form-col">
          <div className="auth-box center" style={{ maxWidth: 380 }}>
            <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--fg-subtle)', lineHeight: 1 }}>404</div>
            <h1>Page not found</h1>
            <p className="lede">That page doesn&apos;t exist. Check the URL, or head back to safety.</p>
            <Link to="/" className="btn btn-primary btn-block btn-lg">Back to home</Link>
          </div>
        </div>
      </div>
    </>
  );
}
