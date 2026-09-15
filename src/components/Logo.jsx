import { Link } from 'react-router-dom';
import { LogoMark } from '../lib/icons.jsx';

export default function Logo({ to = '/', small = false }) {
  return (
    <Link to={to} className="logo" style={small ? { fontSize: 14 } : undefined}>
      <span className="mark" style={small ? { width: 24, height: 24 } : undefined}>
        <LogoMark width={small ? 14 : 18} height={small ? 14 : 18} />
      </span>
      Keystone
    </Link>
  );
}
