import { ArrowLeft, ArrowRight, LockKeyhole } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ApiError, api } from '../services/api';
import type { AuthUser } from '../types';
import { SiteHeader } from '../components/SiteHeader';

interface LoginPageProps {
  onLogin: (token: string, user: AuthUser) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await api.login(email, password);
      onLogin(result.token, result.user);
      window.location.hash = '#/admin';
    } catch (requestError) {
      setError(requestError instanceof ApiError
        ? requestError.message
        : 'No se pudo iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="auth-page">
        <section className="auth-card login-card">
          <a className="back-link" href="#/"><ArrowLeft size={15} /> Volver a explorar</a>
          <span className="auth-icon" aria-hidden="true"><LockKeyhole size={21} /></span>
          <p className="eyebrow">PANEL DEL HOTEL</p>
          <h1>Qué bueno tenerte de vuelta.</h1>
          <p className="auth-intro">Inicia sesión para administrar tu establecimiento y sus habitaciones.</p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="login-email">Correo electrónico<input id="login-email" type="email" autoComplete="email" placeholder="nombre@hotel.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label htmlFor="login-password">Contraseña<input id="login-password" type="password" autoComplete="current-password" placeholder="Ingresa tu contraseña" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary button-full" type="submit" disabled={submitting}>
              {submitting ? 'Ingresando…' : 'Iniciar sesión'} <ArrowRight size={16} aria-hidden="true" />
            </button>
          </form>
          <p className="auth-switch">¿Aún no tienes cuenta? <a href="#/register">Registra tu hotel <ArrowRight size={14} aria-hidden="true" /></a></p>
          <p className="login-security"><LockKeyhole size={13} aria-hidden="true" /> Acceso seguro para administradores de hoteles</p>
        </section>
      </main>
    </>
  );
}
