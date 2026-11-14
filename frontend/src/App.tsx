import { useEffect, useState } from 'react';
import { AdminPage } from './pages/AdminPage';
import { HotelDetailPage } from './pages/HotelDetailPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SearchPage } from './pages/SearchPage';
import { useAuth } from './hooks/useAuth';
import { useHashRoute } from './hooks/useHashRoute';
import { ApiError, api } from './services/api';
import type { Hotel } from './types';
import { Toast } from './components/Toast';
import { useToast } from './hooks/useToast';

function App() {
  const route = useHashRoute();
  const auth = useAuth();
  const [query, setQuery] = useState('');
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<Hotel>();
  const [loadingPublicData, setLoadingPublicData] = useState(false);
  const [publicError, setPublicError] = useState('');
  const { message, showToast } = useToast();

  useEffect(() => {
    let active = true;
    if (route.page === 'home' || route.page === 'search') {
      setLoadingPublicData(true);
      setPublicError('');
      api.searchHotels(route.page === 'search' ? query : '')
        .then((results) => {
          if (active) setHotels(results);
        })
        .catch((error: unknown) => {
          if (active) {
            setPublicError(error instanceof ApiError
              ? error.message
              : 'No se pudo cargar la lista de hoteles.');
          }
        })
        .finally(() => {
          if (active) setLoadingPublicData(false);
        });
    } else if (route.page === 'hotel') {
      setSelectedHotel(undefined);
      setPublicError('');
      setLoadingPublicData(true);
      api.getPublicHotel(route.id)
        .then((hotel) => {
          if (active) setSelectedHotel(hotel);
        })
        .catch((error: unknown) => {
          if (active) {
            setPublicError(error instanceof ApiError
              ? error.message
              : 'No se pudo cargar el perfil del hotel.');
          }
        })
        .finally(() => {
          if (active) setLoadingPublicData(false);
        });
    }
    return () => { active = false; };
  }, [route, query]);

  function search(nextQuery: string) {
    setQuery(nextQuery);
    if (window.location.hash !== '#/search') {
      window.location.hash = '#/search';
    }
  }

  async function logout() {
    const failure = await auth.logout();
    window.location.hash = '#/';
    if (failure) showToast('Cerraste la sesión en este dispositivo; no se pudo confirmar la invalidación en el servidor.');
  }

  if (route.page === 'admin') {
    if (auth.loading) return <main className="auth-page"><p role="status">Validando la sesión…</p></main>;
    if (!auth.user) {
      return <><LoginPage onLogin={auth.authenticate} /><Toast message={message} /></>;
    }
    return <AdminPage onLogout={logout} userRoles={auth.user.roles} />;
  }
  if (route.page === 'login') {
    return <><LoginPage onLogin={auth.authenticate} /><Toast message={message} /></>;
  }
  if (route.page === 'register') {
    return <><RegisterPage onRegister={auth.authenticate} /><Toast message={message} /></>;
  }
  if (route.page === 'hotel') {
    return (
      <>
        <HotelDetailPage
          hotel={selectedHotel}
          loading={loadingPublicData}
          loadError={publicError}
        />
      </>
    );
  }

  return (
    <>
      {publicError && <p className="public-api-error" role="alert">{publicError}</p>}
      {loadingPublicData && <p className="public-loading" role="status">Cargando hoteles…</p>}
      {route.page === 'home' && <HomePage hotels={hotels} onSearch={search} />}
      {route.page === 'search' && <SearchPage hotels={hotels} query={query} onSearch={search} />}
      <Toast message={message} />
    </>
  );
}

export default App;
