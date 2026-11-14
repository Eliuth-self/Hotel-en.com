import { useCallback, useEffect, useState } from 'react';
import type { AuthUser } from '../types';
import { api, hasAccessToken, saveAuthResult, setAccessToken } from '../services/api';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(hasAccessToken);

  useEffect(() => {
    let active = true;
    if (!hasAccessToken()) return undefined;

    api.me()
      .then((authenticatedUser) => {
        if (active) setUser(authenticatedUser);
      })
      .catch((error: unknown) => {
        console.error('No se pudo validar la sesión guardada.', error);
        if (active) {
          if (error instanceof Error && 'status' in error && error.status === 401) {
            setAccessToken(null);
            setUser(null);
          }
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const authenticate = useCallback((token: string, authenticatedUser: AuthUser) => {
    saveAuthResult({ token, user: authenticatedUser, expiresIn: 0 });
    setUser(authenticatedUser);
  }, []);

  const logout = useCallback(async () => {
    let failure: unknown;
    try {
      await api.logout();
    } catch (error) {
      failure = error;
      console.error('La sesión no se pudo invalidar en el servidor.', error);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
    return failure;
  }, []);

  return { user, loading, authenticate, logout };
}
