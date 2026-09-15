import { createContext, useCallback, useContext, useState } from 'react';
import { Api } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const NotifContext = createContext(null);

export function NotifProvider({ children }) {
  const { isAuthed } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!isAuthed) return;
    try {
      const { data } = await Api.unreadCount();
      setUnreadCount(data?.unread_count || 0);
    } catch (e) {
      /* non-fatal */
    }
  }, [isAuthed]);

  return <NotifContext.Provider value={{ unreadCount, refresh }}>{children}</NotifContext.Provider>;
}

export function useNotif() {
  const ctx = useContext(NotifContext);
  if (!ctx) throw new Error('useNotif must be used within a NotifProvider');
  return ctx;
}
