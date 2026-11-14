import { describe, expect, it } from 'vitest';
import { initialHotels, initialRooms } from '../src/data/hotels';
import { findDuplicateRoomNumbers, parseRoomNumbers, searchHotels } from '../src/utils/search';

describe('hotel search', () => {
  it('finds hotels by name, city, and zone without case sensitivity', () => {
    expect(searchHotels(initialHotels, 'casa olivo').map((hotel) => hotel.id)).toEqual(['casa-olivo']);
    expect(searchHotels(initialHotels, 'PUERTO ESCONDIDO').map((hotel) => hotel.id)).toEqual(['brisa-azul']);
    expect(searchHotels(initialHotels, 'sierra sur').map((hotel) => hotel.id)).toEqual(['refugio-bosque']);
  });

  it('returns all hotels for a blank query', () => {
    expect(searchHotels(initialHotels, '  ')).toHaveLength(initialHotels.length);
  });
});

describe('room group helpers', () => {
  it('parses comma-separated room numbers and removes empty entries', () => {
    expect(parseRoomNumbers('101, 102,, 103 ')).toEqual(['101', '102', '103']);
  });

  it('detects existing room numbers case-insensitively', () => {
    expect(findDuplicateRoomNumbers(initialRooms, ['jardín 101', '105'])).toEqual(['jardín 101']);
  });
});
