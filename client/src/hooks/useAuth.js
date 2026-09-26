import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

/**
 * useAuth – convenience hook to access the authentication context.
 *
 * Returns: { user, login, logout, loading }
 *   user    – null when logged out, otherwise { name, email, role }
 *   login   – async (email, password) => result
 *   logout  – async () => void
 *   loading – true while a login/logout request is in flight
 *
 * Throws if used outside <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
