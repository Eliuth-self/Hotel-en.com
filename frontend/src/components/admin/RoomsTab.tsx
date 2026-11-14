import { Plus, BedDouble } from 'lucide-react';
import type { ChangeEvent } from 'react';
import type { Room, RoomStatus } from '../../types';

interface RoomsTabProps {
  rooms: Room[];
  onStatusChange: (index: number, status: RoomStatus) => void;
  onEnableMinibar: (index: number) => void;
  onAddRoom: () => void;
  onCreateGroup: () => void;
}

const statusNames: Record<RoomStatus, string> = {
  disponible: 'Disponible',
  ocupada: 'Ocupada',
  limpieza: 'En limpieza',
  mantenimiento: 'En mantenimiento',
  inactiva: 'Inactiva',
};

const statusOptions: RoomStatus[] = ['disponible', 'ocupada', 'limpieza', 'mantenimiento', 'inactiva'];

function RoomStatusSelect({ room, index, onChange }: {
  room: Room;
  index: number;
  onChange: (index: number, status: RoomStatus) => void;
}) {
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const selected = statusOptions.find((status) => status === event.target.value);
    if (selected) onChange(index, selected);
  }
  return (
    <label className="status-select-label">
      <span className="sr-only">Estado de {room.number}</span>
      <select className={`status-select ${room.status}`} value={room.status} onChange={handleChange}>
        {statusOptions.map((status) => <option value={status} key={status}>{statusNames[status]}</option>)}
      </select>
    </label>
  );
}

function MinibarControl({ room, index, onEnable }: {
  room: Room;
  index: number;
  onEnable: (index: number) => void;
}) {
  return room.minibar
    ? <span className="room-minibar-active">Minibar activo</span>
    : <button type="button" className="room-minibar-toggle" onClick={() => onEnable(index)}>Activar minibar</button>;
}

export function RoomsTab({ rooms, onStatusChange, onEnableMinibar, onAddRoom, onCreateGroup }: RoomsTabProps) {
  return (
    <>
      <div className="admin-heading">
        <div><p className="eyebrow">GESTIÓN DEL HOTEL</p><h1>Habitaciones</h1><p>Actualiza el estado actual de cada espacio.</p></div>
        <span className="status-pill available">{rooms.length} habitaciones</span>
      </div>
      <section className="admin-panel rooms-panel">
        <div className="panel-heading">
          <div><h2>Lista de habitaciones</h2><p>Los cambios se reflejan en la información pública del hotel.</p></div>
          <button className="button button-outline add-room-button" onClick={onAddRoom}><Plus size={16} /> Agregar habitación</button>
        </div>
        <div className="room-table">
          <div className="room-table-header"><span>HABITACIÓN</span><span>DETALLES</span><span>ESTADO ACTUAL</span></div>
          {rooms.map((room, index) => (
            <div className="room-table-row" key={room.number}>
              <div className="room-table-name"><span className="room-row-icon"><BedDouble size={16} /></span><span><b>{room.number}</b><small>{room.type}</small></span></div>
              <span className="room-table-details"><span>{room.detail}</span><MinibarControl room={room} index={index} onEnable={onEnableMinibar} /></span>
              <RoomStatusSelect room={room} index={index} onChange={onStatusChange} />
            </div>
          ))}
        </div>
        <div className="mobile-room-list">
          {rooms.map((room, index) => (
            <div className="room-mobile-card" key={room.number}>
              <div className="room-table-name"><span className="room-row-icon"><BedDouble size={16} /></span><span><b>{room.number}</b><small>{room.type}</small></span></div>
              <MinibarControl room={room} index={index} onEnable={onEnableMinibar} />
              <RoomStatusSelect room={room} index={index} onChange={onStatusChange} />
            </div>
          ))}
        </div>
        <div className="group-create-card">
          <div className="group-symbol"><BedDouble size={20} /></div>
          <div><h3>Crear desde un grupo reutilizable</h3><p>Usa una plantilla para generar varias habitaciones con características y tarifas comunes.</p></div>
          <button className="button button-primary" onClick={onCreateGroup}><Plus size={16} /> Crear habitación</button>
        </div>
      </section>
    </>
  );
}
