import { X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

interface RoomEditorDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (values: { number: string; type: string; location: string; price: number; contents: string[]; minibar: boolean }) => void;
}

export function RoomEditorDialog({ open, onClose, onCreate }: RoomEditorDialogProps) {
  const [number, setNumber] = useState('');
  const [type, setType] = useState('Habitación estándar');
  const [location, setLocation] = useState('Piso 1');
  const [price, setPrice] = useState('180000');
  const [contents, setContents] = useState('Cama doble, Televisor, Baño privado');
  const [minibar, setMinibar] = useState(false);

  useEffect(() => {
    if (open) {
      setNumber('');
      setMinibar(false);
    }
  }, [open]);

  if (!open) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedNumber = number.trim();
    const normalizedType = type.trim();
    const amount = Number(price);
    if (normalizedNumber && normalizedType && location.trim() && Number.isFinite(amount) && amount > 0) {
      onCreate({
        number: normalizedNumber,
        type: normalizedType,
        location: location.trim(),
        price: amount,
        contents: contents.split(',').map((content) => content.trim()).filter(Boolean),
        minibar,
      });
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <form className="modal-card" role="dialog" aria-modal="true" aria-labelledby="room-title" onSubmit={handleSubmit}>
        <button className="modal-close icon-button" type="button" aria-label="Cerrar" onClick={onClose}><X size={20} /></button>
        <p className="eyebrow">NUEVA HABITACIÓN</p>
        <h2 id="room-title">Agregar habitación</h2>
        <p className="muted">Registra una habitación para administrarla y actualizar su estado.</p>
        <label htmlFor="room-number">Número o código</label>
        <input id="room-number" value={number} onChange={(event) => setNumber(event.target.value)} placeholder="Por ejemplo, 105" required maxLength={40} />
        <label htmlFor="room-type" className="room-type-label">Tipo de habitación</label>
        <input id="room-type" value={type} onChange={(event) => setType(event.target.value)} required maxLength={100} />
        <label htmlFor="room-location" className="room-type-label">Ubicación</label>
        <input id="room-location" value={location} onChange={(event) => setLocation(event.target.value)} required maxLength={180} />
        <label htmlFor="room-price" className="room-type-label">Tarifa por noche (COP)</label>
        <input id="room-price" type="number" min="1" step="1" value={price} onChange={(event) => setPrice(event.target.value)} required />
        <label className="room-minibar-checkbox"><input type="checkbox" checked={minibar} onChange={(event) => setMinibar(event.target.checked)} /> Incluye minibar</label>
        <label htmlFor="room-content" className="room-type-label">Características separadas por coma</label>
        <textarea id="room-content" rows={2} value={contents} onChange={(event) => setContents(event.target.value)} />
        <div className="modal-actions">
          <button type="button" className="button button-outline" onClick={onClose}>Cancelar</button>
          <button type="submit" className="button button-primary">Agregar habitación</button>
        </div>
      </form>
    </div>
  );
}
