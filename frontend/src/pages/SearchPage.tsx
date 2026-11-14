import { ArrowRight, Search } from 'lucide-react';
import { useMemo } from 'react';
import type { Hotel } from '../types';
import { AvailabilityNote } from '../components/AvailabilityNote';
import { HotelCard } from '../components/HotelCard';
import { SearchBar } from '../components/SearchBar';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';
import { searchHotels } from '../utils/search';

interface SearchPageProps {
  hotels: Hotel[];
  query: string;
  onSearch: (query: string) => void;
}

export function SearchPage({ hotels, query, onSearch }: SearchPageProps) {
  const results = useMemo(() => searchHotels(hotels, query), [hotels, query]);

  return (
    <>
      <SiteHeader />
      <main className="page-shell">
        <section className="search-results-head">
          <p className="eyebrow">EXPLORA DESTINOS</p>
          <h1>Hoteles para ti</h1>
          <p>Consulta la información y el estado actual de las habitaciones.</p>
          <SearchBar key={query} initialValue={query} onSearch={onSearch} />
          <div className="results-meta">
            <span>{results.length} {results.length === 1 ? 'hotel encontrado' : 'hoteles encontrados'}{query ? ` para “${query}”` : ''}</span>
            <span className="live-note"><i /> Información actual</span>
          </div>
        </section>
        {results.length > 0 ? (
          <div className="hotel-grid results-grid">{results.map((hotel) => <HotelCard key={hotel.id} hotel={hotel} />)}</div>
        ) : (
          <section className="empty-state">
            <span className="empty-icon"><Search size={25} /></span>
            <h2>No encontramos hoteles</h2>
            <p>Prueba con otra ciudad o con el nombre de un hotel.</p>
            <button className="button button-outline" onClick={() => onSearch('')}>Ver todos los hoteles <ArrowRight size={15} /></button>
          </section>
        )}
        <AvailabilityNote />
      </main>
      <SiteFooter />
    </>
  );
}
