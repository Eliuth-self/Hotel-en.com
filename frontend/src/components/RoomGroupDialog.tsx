import { X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import type { ApiRoomGroup, RoomGroupPayload } from '../services/api';

interface RoomGroupDialogProps {
  open: boolean;
  groups: ApiRoomGroup[];
  onClose: () => void;
  onCreate: (values: { groupId?: string; group?: RoomGroupPayload; numbers: string[] }) => void;
}

export function RoomGroupDialog({ open, groups, onClose, onCreate }: RoomGroupDialogProps) {
  const [numbers, setNumbers] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [name, setName] = useState('Estándar');
  const [location, setLocation] = useState('Piso 1');
  const [price, setPrice] = useState('180000');
  const [contents, setContents] = useState('Cama doble, Televisor, Baño privado');
  const [minibar, setMinibar] = useState(false);

  useEffect(() => {
    if (open) {
      setNumbers('');
      setSelectedGroup('');
    }
  }, [open]);

  if (!open) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const roomNumbers = numbers.split(',').map((number) => number.trim()).filter(Boolean);
    if (selectedGroup) {
      onCreate({ groupId: selectedGroup, numbers: roomNumbers });
      return;
    }
    const amount = Number(price);
    if (!Number.isFinite(amount) || amount <= 0) return;
    onCreate({
      numbers: roomNumbers,
      group: {
        nombre: name.trim(),
        ubicacion: location.trim(),
        minibar,
        resena: null,
        contenido: contents.split(',').map((content) => content.trim()).filter(Boolean),
        tarifas: [{ modalidad: 'Noche', precio: amount, moneda: 'COP' }],
      },
    });
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <form className="modal-card" role="dialog" aria-modal="true" aria-labelledby="group-title" onSubmit={handleSubmit}>
        <button className="modal-close icon-button" type="button" aria-label="Cerrar" onClick={onClose}><X size={20} /></button>
        <p className="eyebrow">CREACIÓN EN LOTE</p>
        <h2 id="group-title">Crear desde un grupo</h2>
        <p className="muted">Usa una plantilla guardada o crea una reutilizable con características y tarifa comunes.</p>
        <label htmlFor="room-group">Plantilla</label>
        <select id="room-group" value={selectedGroup} onChange={(event) => setSelectedGroup(event.target.value)}>
          <option value="">Crear nueva plantilla</option>
          {groups.map((group) => <option value={group.id} key={group.id}>{group.nombre} · {group.ubicacion}</option>)}
        </select>
        {!selectedGroup && (
          <div className="group-template-fields">
            <label htmlFor="group-name">Nombre del grupo<input id="group-name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={180} /></label>
            <label htmlFor="group-location">Ubicación<input id="group-location" value={location} onChange={(event) => setLocation(event.target.value)} required maxLength={180} /></label>
            <label htmlFor="group-price">Tarifa por noche (COP)<input id="group-price" type="number" min="1" step="1" value={price} onChange={(event) => setPrice(event.target.value)} required /></label>
            <label htmlFor="group-contents">Características, separadas por coma<textarea id="group-contents" rows={2} value={contents} onChange={(event) => setContents(event.target.value)} /></label>
            <label className="checkbox-field"><input type="checkbox" checked={minibar} onChange={(event) => setMinibar(event.target.checked)} /> Incluye minibar</label>
          </div>
        )}
        <label htmlFor="room-numbers">Números de habitación</label>
        <textarea
          id="room-numbers"
          rows={3}
          value={numbers}
          onChange={(event) => setNumbers(event.target.value)}
          placeholder="101, 102, 103"
          required
        />
        <span className="field-hint">Separa los números con comas. Máximo 500 por lote.</span>
        <div className="modal-actions">
          <button type="button" className="button button-outline" onClick={onClose}>Cancelar</button>
          <button type="submit" className="button button-primary">Crear habitaciones</button>
        </div>
      </form>
    </div>
  );
}
