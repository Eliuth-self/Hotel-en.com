import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { SiteHeader } from '../components/SiteHeader';
import { ApiError, api } from '../services/api';
import type { AuthUser } from '../types';

interface RegisterFields {
  razon_social: string;
  tipo_documento: string;
  numero_documento: string;
  correo_contacto: string;
  nombre_comercial: string;
  tipo_establecimiento: 'hotel' | 'residencia' | 'motel';
  ciudad: string;
  direccion: string;
  telefono: string;
  nombres: string;
  apellidos: string;
  correo: string;
  password: string;
}

const initialFields: RegisterFields = {
  razon_social: '',
  tipo_documento: 'NIT',
  numero_documento: '',
  correo_contacto: '',
  nombre_comercial: '',
  tipo_establecimiento: 'hotel',
  ciudad: '',
  direccion: '',
  telefono: '',
  nombres: '',
  apellidos: '',
  correo: '',
  password: '',
};

interface RegisterPageProps {
  onRegister: (token: string, user: AuthUser) => void;
}

export function RegisterPage({ onRegister }: RegisterPageProps) {
  const [fields, setFields] = useState(initialFields);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function updateField(field: keyof RegisterFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await api.register({
        empresa: {
          razon_social: fields.razon_social,
          tipo_documento: fields.tipo_documento,
          numero_documento: fields.numero_documento,
          correo_contacto: fields.correo_contacto,
          telefono: fields.telefono,
        },
        establecimiento: {
          nombre_comercial: fields.nombre_comercial,
          tipo_establecimiento: fields.tipo_establecimiento,
          direccion: [fields.direccion, fields.ciudad].filter(Boolean).join(', '),
          telefono: fields.telefono,
          whatsapp: fields.telefono,
        },
        administrador: {
          nombres: fields.nombres,
          apellidos: fields.apellidos,
          correo: fields.correo,
          password: fields.password,
          telefono: fields.telefono,
        },
      });
      onRegister(result.token, result.user);
      window.location.hash = '#/admin';
    } catch (requestError) {
      setError(requestError instanceof ApiError
        ? requestError.message
        : 'No se pudo completar el registro. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="auth-page register-page">
        <section className="auth-card register-card">
          <div className="register-intro">
            <a className="back-link" href="#/"><ArrowLeft size={15} /> Volver a explorar</a>
            <p className="eyebrow">BIENVENIDO A HOTEL EN.COM</p>
            <h1>Registra tu hotel</h1>
            <p className="auth-intro">Crea tu cuenta en tres pasos. Al terminar podrás administrar el perfil y las habitaciones de tu establecimiento.</p>
            <p className="register-time"><span aria-hidden="true">✦</span> Toma aproximadamente 2 minutos · Tu hotel comienza oculto al público</p>
          </div>
          <nav className="register-progress" aria-label="Secciones del registro">
            <a href="#company-info"><span>01</span><b>Empresa</b></a>
            <i aria-hidden="true" />
            <a href="#establishment-info"><span>02</span><b>Hotel</b></a>
            <i aria-hidden="true" />
            <a href="#administrator-info"><span>03</span><b>Administrador</b></a>
          </nav>
          <form className="auth-form register-form" onSubmit={handleSubmit}>
            <section id="company-info" className="register-step">
              <div className="register-section-title"><span>01</span><div><h2>Datos de la empresa</h2><p>Información legal de la empresa propietaria.</p></div></div>
              <div className="form-grid">
                <label className="span-two">Razón social<input autoComplete="organization" placeholder="Ej. Hotel del Parque S.A.S." value={fields.razon_social} onChange={(event) => updateField('razon_social', event.target.value)} required maxLength={180} /></label>
                <label>Tipo de documento<select value={fields.tipo_documento} onChange={(event) => updateField('tipo_documento', event.target.value)}><option>NIT</option><option>CC</option><option>RUT</option><option>Otro</option></select></label>
                <label>Número de documento<input placeholder="Número de identificación" value={fields.numero_documento} onChange={(event) => updateField('numero_documento', event.target.value)} required maxLength={60} /></label>
                <label className="span-two">Correo de la empresa<input type="email" autoComplete="email" placeholder="contacto@tuempresa.com" value={fields.correo_contacto} onChange={(event) => updateField('correo_contacto', event.target.value)} required /></label>
              </div>
            </section>
            <section id="establishment-info" className="register-step">
              <div className="register-section-title"><span>02</span><div><h2>Tu establecimiento</h2><p>Así podrán identificar y encontrar tu hotel.</p></div></div>
              <div className="form-grid">
                <label className="span-two">Nombre comercial<input autoComplete="organization-title" placeholder="Nombre que verán tus huéspedes" value={fields.nombre_comercial} onChange={(event) => updateField('nombre_comercial', event.target.value)} required maxLength={180} /></label>
                <label>Tipo de establecimiento<select value={fields.tipo_establecimiento} onChange={(event) => updateField('tipo_establecimiento', event.target.value as RegisterFields['tipo_establecimiento'])}><option value="hotel">Hotel</option><option value="residencia">Residencia</option><option value="motel">Motel</option></select></label>
                <label>Ciudad o municipio<input autoComplete="address-level2" placeholder="Ej. Medellín" value={fields.ciudad} onChange={(event) => updateField('ciudad', event.target.value)} required /></label>
                <label className="span-two">Dirección del hotel<input autoComplete="street-address" placeholder="Calle, carrera, número y barrio" value={fields.direccion} onChange={(event) => updateField('direccion', event.target.value)} required /></label>
                <label className="span-two"><span className="register-label-line"><span>Teléfono / WhatsApp</span><span className="optional-label">Opcional</span></span><input type="tel" autoComplete="tel" placeholder="Ej. +57 300 123 4567" value={fields.telefono} onChange={(event) => updateField('telefono', event.target.value)} /></label>
              </div>
            </section>
            <section id="administrator-info" className="register-step">
              <div className="register-section-title"><span>03</span><div><h2>Cuenta de administrador</h2><p>Usarás estos datos para ingresar al panel del hotel.</p></div></div>
              <div className="form-grid">
                <label>Nombres<input autoComplete="given-name" placeholder="Tus nombres" value={fields.nombres} onChange={(event) => updateField('nombres', event.target.value)} required maxLength={120} /></label>
                <label>Apellidos<input autoComplete="family-name" placeholder="Tus apellidos" value={fields.apellidos} onChange={(event) => updateField('apellidos', event.target.value)} required maxLength={120} /></label>
                <label className="span-two">Correo para iniciar sesión<input type="email" autoComplete="username" placeholder="tu-correo@ejemplo.com" value={fields.correo} onChange={(event) => updateField('correo', event.target.value)} required /></label>
                <label className="span-two">Crea una contraseña<input type="password" value={fields.password} onChange={(event) => updateField('password', event.target.value)} required minLength={10} autoComplete="new-password" aria-describedby="password-hint" /><small id="password-hint">Debe tener al menos 10 caracteres. Evita usar una contraseña que ya utilices en otro sitio.</small></label>
              </div>
            </section>
            <p className="registration-privacy">Al crear la cuenta, tu hotel permanecerá oculto. Podrás revisar el perfil y activar su visibilidad cuando esté listo.</p>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary button-full register-submit" type="submit" disabled={submitting}>
              {submitting ? 'Creando cuenta…' : 'Crear cuenta del hotel'} <ArrowRight size={16} />
            </button>
          </form>
          <p className="auth-switch">¿Ya tienes una cuenta? <a href="#/login">Inicia sesión</a></p>
        </section>
      </main>
    </>
  );
}
