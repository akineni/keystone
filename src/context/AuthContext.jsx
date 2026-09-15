import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { clearPersistedSession, getStoredUser, getToken, onUnauthorized, persistSession, persistUser, resetRedirectGuard } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getToken());

  // The api client can't reach into React state directly (it's a plain module,
  // not a hook), so it publishes "you just got a 401" here instead.
  useEffect(() => onUnauthorized(() => {
    setToken(null);
    setUserState(null);
  }), []);

  const setSession = useCallback((data) => {
    persistSession(data);
    resetRedirectGuard();
    setToken(data.access_token);
    if (data.user) setUserState(data.user);
  }, []);

  const setUser = useCallback((u) => {
    persistUser(u);
    setUserState(u);
  }, []);

  const clearSession = useCallback(() => {
    clearPersistedSession();
    setToken(null);
    setUserState(null);
  }, []);

  const value = { user, token, isAuthed: !!token, setSession, setUser, clearSession };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
