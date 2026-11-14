import type { RoomCounts } from '../types';

const statusInfo = {
  disponible: { singular: 'disponible', plural: 'disponibles', className: 'available' },
  ocupada: { singular: 'ocupada', plural: 'ocupadas', className: 'occupied' },
  limpieza: { singular: 'en limpieza', plural: 'en limpieza', className: 'cleaning' },
  mantenimiento: { singular: 'en mantenimiento', plural: 'en mantenimiento', className: 'maintenance' },
  inactiva: { singular: 'inactiva', plural: 'inactivas', className: 'inactive' },
} as const;
type BadgeStatus = keyof typeof statusInfo;

interface StatusBadgeProps {
  status: BadgeStatus;
  count?: number;
}

export function StatusBadge({ status, count }: StatusBadgeProps) {
  if (count === 0) return null;
  const info = statusInfo[status];
  const label = count === undefined
    ? info.singular.charAt(0).toUpperCase() + info.singular.slice(1)
    : `${count} ${count === 1 ? info.singular : info.plural}`;
  return <span className={`status-pill ${info.className}`}>{label}</span>;
}

interface HotelStatusSummaryProps {
  counts: RoomCounts;
}

export function HotelStatusSummary({ counts }: HotelStatusSummaryProps) {
  const statuses: (keyof RoomCounts)[] = ['disponible', 'ocupada', 'limpieza', 'mantenimiento'];
  return (
    <div className="status-list">
      {statuses.map((status) => (
        <StatusBadge key={status} status={status} count={counts[status]} />
      ))}
    </div>
  );
}
