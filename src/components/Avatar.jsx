import { initials } from '../lib/format.js';

export default function Avatar({ user, size = 'md', className = '' }) {
  const cls = `avatar avatar-${size}${className ? ' ' + className : ''}`;
  if (user?.avatar) {
    return <div className={cls} style={{ backgroundImage: `url('${user.avatar}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />;
  }
  return <div className={cls}>{user ? initials(user.fullname || user.firstname || user.email) : '-'}</div>;
}
