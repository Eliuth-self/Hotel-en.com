import { ArrowLeft, ArrowUpRight, BedDouble, MapPin, Phone } from 'lucide-react';
import type { Hotel, Room } from '../types';
import { AvailabilityNote } from '../components/AvailabilityNote';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';
import { hotelImages } from '../data/hotels';
import { googleMapsUrl } from '../utils/search';

interface HotelDetailPageProps {
  hotel?: Hotel;
  rooms?: Room[];
  loading?: boolean;
  loadError?: string;
}

export function HotelDetailPage({ hotel, rooms, loading = false, loadError = '' }: HotelDetailPageProps) {
  if (loading || loadError) {
    return (
      <>
        <SiteHeader />
        <main className="page-shell empty-state" role={loadError ? 'alert' : 'status'}>
          <h1>{loadError ? 'No pudimos cargar este hotel' : 'Cargando información del hotel…'}</h1>
          {loadError && <p>{loadError}</p>}
          <a className="button button-primary" href="#/search">Volver a explorar</a>
        </main>
        <SiteFooter />
      </>
    );
  }
  if (!hotel) {
    return (
      <>
        <SiteHeader />
        <main className="page-shell empty-state"><h1>No encontramos ese hotel</h1><a className="button button-primary" href="#/search">Volver a explorar</a></main>
        <SiteFooter />
      </>
    );
  }

  const availableRooms = (rooms ?? hotel.rooms).filter((room) => room.status === 'disponible');
  const mapsHref = googleMapsUrl(hotel.address, hotel.city);
  const phoneHref = hotel.phone.replace(/[^\d+]/g, '');
  const whatsappMessage = encodeURIComponent(`Hola, vi ${hotel.name} en Hotel En.com. ¿Me pueden compartir información sobre disponibilidad y tarifas?`);

  return (
    <>
      <SiteHeader />
      <main className="page-shell detail-shell">
        <a href="#/search" className="back-link"><ArrowLeft size={16} /> Volver a los resultados</a>
        <section className="detail-gallery">
          <img className="gallery-main" src={hotel.image} alt={`Hotel ${hotel.name}`} />
          <img src={hotelImages.room} alt={`Habitación en ${hotel.name}`} loading="lazy" />
          <img src={hotelImages.room} alt="Detalle de una habitación" loading="lazy" />
        </section>
        <div className="detail-layout">
          <section className="detail-main">
            <p className="eyebrow">{hotel.kind} · {hotel.zone.toLocaleUpperCase()}</p>
            <h1>{hotel.name}</h1>
            <p className="detail-location"><MapPin size={17} /> {hotel.city}</p>
            <p className="detail-description">{hotel.description}</p>
            <a className="address-link" href={mapsHref} target="_blank" rel="noopener noreferrer">
              <MapPin size={16} /> {hotel.address}<span>Cómo llegar <ArrowUpRight size={13} /></span>
            </a>
            <section className="room-section">
              <div className="section-heading compact">
                <div><p className="eyebrow">ESTADO ACTUAL</p><h2>Habitaciones disponibles</h2></div>
                <span className="status-pill available">{availableRooms.length} disponibles</span>
              </div>
              {availableRooms.length ? (
                <div className="room-public-list">
                  {availableRooms.map((room) => <PublicRoomCard key={room.number} room={room} />)}
                </div>
              ) : (
                <div className="inline-empty"><p>En este momento no hay habitaciones marcadas como disponibles.</p><p>Puedes comunicarte con el hotel para consultar información.</p></div>
              )}
            </section>
            <AvailabilityNote />
            <p className="availability-disclaimer">Las tarifas son informativas. Consultar esta página no es una reserva.</p>
          </section>
          <aside className="contact-card">
            <p className="eyebrow">CONTACTO DIRECTO</p>
            <h2>Habla directamente<br />con el hotel</h2>
            <a className="button button-primary button-full" href={`https://wa.me/${hotel.whatsapp}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer">◉ &nbsp; WhatsApp</a>
            <a className="button button-outline button-full" href={`tel:${phoneHref}`}><Phone size={16} /> &nbsp; Llamar</a>
            <a className="button button-outline button-full" href={mapsHref} target="_blank" rel="noopener noreferrer"><MapPin size={16} /> &nbsp; Cómo llegar</a>
            <p className="contact-disclaimer">Los estados son informativos. La disponibilidad futura no está garantizada. No se realizan reservas en Hotel En.com.</p>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function PublicRoomCard({ room }: { room: Room }) {
  return (
    <article className="public-room">
      <div className="room-icon"><BedDouble size={19} /></div>
      <div className="room-info"><h3>{room.type}</h3><p>{room.detail}</p></div>
      <strong>{room.price}<small>por noche*</small></strong>
    </article>
  );
}
