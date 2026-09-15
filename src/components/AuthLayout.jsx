import Ambient from './Ambient.jsx';
import Logo from './Logo.jsx';

export function AuthVisual({ quote, quoteSub, stats }) {
  return (
    <>
      <Logo />
      <div className="quote fade-up">
        &quot;{quote}&quot;
        <span>{quoteSub}</span>
      </div>
      <div className="orbit-stats fade-up" style={{ animationDelay: '.1s' }}>
        {stats.map((s, i) => (
          <div className="stat" key={i}>
            <div className="ic">{s.icon}</div>
            <div>
              <div className="t">{s.title}</div>
              <div className="d">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function AuthLayout({ visual, maxWidth, children }) {
  return (
    <>
      <Ambient />
      <div className="auth-shell" style={visual ? undefined : { gridTemplateColumns: '1fr' }}>
        {visual && <aside className="auth-visual">{visual}</aside>}
        <div className="auth-form-col">
          <div className="auth-box" style={maxWidth ? { maxWidth } : undefined}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
