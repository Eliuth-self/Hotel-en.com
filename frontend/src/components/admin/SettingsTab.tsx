import { useEffect, useState, type FormEvent } from 'react';
import type { HotelProfile } from '../../types';

interface SettingsTabProps {
  profile: HotelProfile;
  publicEnabled: boolean;
  onSave: (profile: HotelProfile, publicEnabled: boolean) => void;
}

export function SettingsTab({ profile, publicEnabled, onSave }: SettingsTabProps) {
  const [form, setForm] = useState(profile);
  const [isPublic, setIsPublic] = useState(publicEnabled);

  useEffect(() => {
    setForm(profile);
    setIsPublic(publicEnabled);
  }, [profile, publicEnabled]);

  function updateField(field: keyof HotelProfile, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(form, isPublic);
  }

  return (
    <>
      <div className="admin-heading">
        <div><p className="eyebrow">AJUSTES DEL HOTEL</p><h1>Perfil público</h1><p>Controla cómo aparece tu hotel cuando decides compartirlo.</p></div>
      </div>
      <form className="admin-panel settings-form" onSubmit={handleSubmit}>
        <div className="visibility-control">
          <div><h2>Mostrar mi hotel al público</h2><p>{isPublic ? 'Las personas pueden encontrar y consultar el perfil público de tu hotel.' : 'Al activarlo, el hotel aparecerá en búsquedas y podrá mostrar sus habitaciones.'}</p></div>
          <label className="switch">
            <input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} />
            <span className="switch-track" />
            <span className="sr-only">Mostrar mi hotel al público</span>
          </label>
        </div>
        <div className="form-divider" />
        <div className="panel-heading">
          <div><h2>Información del hotel</h2><p>Estos datos forman parte de tu perfil.</p></div>
          <span className="status-pill available">Perfil del hotel</span>
        </div>
        <div className="form-grid">
          <label>Nombre del hotel<input required value={form.name} onChange={(event) => updateField('name', event.target.value)} /></label>
          <label>Tipo de establecimiento
            <select value={form.kind} onChange={(event) => updateField('kind', event.target.value)}>
              <option value="hotel">Hotel</option><option value="residencia">Residencia</option><option value="motel">Motel</option>
            </select>
          </label>
          <label className="span-two">Descripción<textarea rows={3} value={form.description} onChange={(event) => updateField('description', event.target.value)} /></label>
          <label className="span-two">Dirección (incluye ciudad o municipio)<input value={form.address} onChange={(event) => updateField('address', event.target.value)} /></label>
          <label>Teléfono<input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} /></label>
          <label>WhatsApp<input value={form.whatsapp} onChange={(event) => updateField('whatsapp', event.target.value)} /></label>
          <label>Correo de contacto<input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} /></label>
        </div>
        <p className="form-hint">La ubicación se busca por la dirección completa. Los teléfonos y direcciones solo aparecen cuando la visibilidad está activada.</p>
        <div className="form-actions"><button className="button button-primary" type="submit">Guardar cambios</button></div>
      </form>
    </>
  );
}
