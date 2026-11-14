import { ArrowUpRight, MapPin } from 'lucide-react';
import type { Hotel } from '../types';
import { HotelStatusSummary } from './StatusBadges';

interface HotelCardProps {
  hotel: Hotel;
}

export function HotelCard({ hotel }: HotelCardProps) {
  return (
    <article className="hotel-card">
      <a className="hotel-image-link" href={`#/hotel/${encodeURIComponent(hotel.id)}`} aria-label={`Ver ${hotel.name}`}>
        <img className="hotel-card-image" src={hotel.image} alt={`Vista de ${hotel.name}`} loading="lazy" />
        <span className="image-label">{hotel.kind}</span>
      </a>
      <div className="hotel-card-body">
        <h3>{hotel.name}</h3>
        <p className="hotel-location"><MapPin size={14} aria-hidden="true" /> {hotel.city}</p>
        <HotelStatusSummary counts={hotel.counts} />
        <a className="text-link" href={`#/hotel/${encodeURIComponent(hotel.id)}`}>
          Ver hotel <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}
