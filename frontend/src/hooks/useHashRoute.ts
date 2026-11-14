import { useEffect, useState } from 'react';
import type { PublicRoute } from '../types';

function readRoute(): PublicRoute {
  const parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'search') return { page: 'search' };
  if (parts[0] === 'login') return { page: 'login' };
  if (parts[0] === 'register') return { page: 'register' };
  if (parts[0] === 'hotel' && parts[1]) {
    return { page: 'hotel', id: decodeURIComponent(parts[1]) };
  }
  if (parts[0] === 'admin') return { page: 'admin' };
  return { page: 'home' };
}

export function useHashRoute() {
  const [route, setRoute] = useState<PublicRoute>(readRoute);

  useEffect(() => {
    const handleChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', handleChange);
    return () => window.removeEventListener('hashchange', handleChange);
  }, []);

  return route;
}
