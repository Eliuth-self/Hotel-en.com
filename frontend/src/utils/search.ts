import type { Hotel, Room } from '../types';

export function searchHotels(hotels: Hotel[], query: string): Hotel[] {
  const term = query.trim().toLocaleLowerCase();
  if (!term) return hotels;
  return hotels.filter((hotel) => (
    `${hotel.name} ${hotel.city} ${hotel.zone}`.toLocaleLowerCase().includes(term)
  ));
}

export function parseRoomNumbers(input: string): string[] {
  return [...new Set(input.split(',').map((number) => number.trim()).filter(Boolean))];
}

export function findDuplicateRoomNumbers(rooms: Room[], incoming: string[]): string[] {
  const currentNumbers = new Set(rooms.map((room) => room.number.toLocaleLowerCase()));
  return incoming.filter((number) => currentNumbers.has(number.toLocaleLowerCase()));
}

export function googleMapsUrl(address: string, city: string): string {
  const query = encodeURIComponent(`${address}, ${city}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
