import { ArrowRight, Eye } from 'lucide-react';
import type { Room, RoomStatus } from '../../types';
import type { AdminTab } from './AdminLayout';
import { StatusBadge } from '../StatusBadges';

interface DashboardTabProps {
  rooms: Room[];
  publicEnabled: boolean;
  hotelName: string;
  onTabChange: (tab: AdminTab) => void;
}

const stats: { status: RoomStatus; label: string; color: string }[] = [
  { status: 'disponible', label: 'Disponibles', color: 'mint' },
  { status: 'ocupada', label: 'Ocupadas', color: 'sand' },
  { status: 'limpieza', label: 'En limpieza', color: 'blue' },
  { status: 'mantenimiento', label: 'En mantenimiento', color: 'peach' },
];

export function DashboardTab({ rooms, publicEnabled, hotelName, onTabChange }: DashboardTabProps) {
  return (
    <>
      <div className="admin-heading">
        <div><p className="eyebrow">PANEL DEL HOTEL</p><h1>Bienvenido, {hotelName}</h1><p>Así se encuentran tus habitaciones ahora.</p></div>
        <span className="update-badge"><i /> Estado actual</span>
      </div>
      <div className="stats-grid">
        {stats.map(({ status, label, color }) => (
          <article className={`stat-card ${color}`} key={status}>
            <span className="stat-label">{label}</span>
            <strong>{rooms.filter((room) => room.status === status).length}</strong>
            <span>habitaciones</span>
          </article>
        ))}
      </div>
      <section className="admin-panel">
        <div className="panel-heading">
          <div><h2>Habitaciones</h2><p>Estado registrado actualmente</p></div>
          <button className="text-button" onClick={() => onTabChange('rooms')}>Ver todas <ArrowRight size={14} /></button>
        </div>
        <div className="activity-list">
          {rooms.slice(0, 4).map((room) => (
            <div className="activity-row" key={room.number}>
              <span className={`activity-dot ${room.status}`} />
              <span><b>{room.type} · {room.number}</b><small>Estado de habitación</small></span>
              <StatusBadge status={room.status} count={1} />
            </div>
          ))}
        </div>
      </section>
      <section className="visibility-summary">
        <div className="visibility-icon"><Eye size={19} /></div>
        <div><h2>Visibilidad pública</h2><p>{publicEnabled ? 'Tu hotel está visible en las búsquedas públicas.' : 'Tu hotel no aparece en las búsquedas públicas.'}</p></div>
        <button className="button button-soft" onClick={() => onTabChange('settings')}>Configurar <ArrowRight size={15} /></button>
      </section>
    </>
  );
}
