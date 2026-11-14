import { ArrowRight, Check } from 'lucide-react';
import type { Hotel } from '../types';
import { HotelCard } from '../components/HotelCard';
import { SearchBar } from '../components/SearchBar';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';
import { hotelImages } from '../data/hotels';

interface HomePageProps {
  hotels: Hotel[];
  onSearch: (query: string) => void;
}

export function HomePage({ hotels, onSearch }: HomePageProps) {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <img className="hero-image" src={hotelImages.hero} alt="" aria-hidden="true" />
          <div className="hero-shade" />
          <div className="hero-content">
            <p className="eyebrow eyebrow-light">ENCUENTRA TU LUGAR FAVORITO</p>
            <h1>Un buen viaje<br />empieza aquí.</h1>
            <p className="hero-copy">Explora hoteles con encanto y consulta el estado actual de sus habitaciones.</p>
            <SearchBar onSearch={onSearch} />
            <p className="hero-note"><Check size={14} /> Estados actuales informativos; la disponibilidad futura puede cambiar.</p>
          </div>
          <span className="hero-caption">Encuentra tu próxima estancia</span>
        </section>
        <section className="section discover-section">
          <div className="section-heading">
            <div><p className="eyebrow">EXPLORA DESTINOS</p><h2>Hoteles para descubrir</h2><p className="section-subtitle">Encuentra una estancia que se sienta como tú.</p></div>
            <a className="subtle-link desktop-only" href="#/search">Ver todos <ArrowRight size={15} /></a>
          </div>
          <div className="hotel-grid">{hotels.slice(0, 3).map((hotel) => <HotelCard key={hotel.id} hotel={hotel} />)}</div>
          <div className="mobile-center"><a className="button button-outline" href="#/search">Explorar destinos <ArrowRight size={15} /></a></div>
        </section>
        <section className="owner-banner">
          <div><p className="eyebrow eyebrow-light">¿TIENES UN HOTEL?</p><h2>Tu próxima historia<br />empieza aquí.</h2><p>Presenta tu hotel a personas que están buscando dónde hospedarse.</p></div>
          <a className="button button-light" href="#/admin">Conoce el panel del hotel <ArrowRight size={16} /></a>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
