export type RoomStatus = 'disponible' | 'ocupada' | 'limpieza' | 'mantenimiento' | 'inactiva';

export interface Room {
  id?: string;
  number: string;
  type: string;
  detail: string;
  price: string;
  status: RoomStatus;
  minibar?: boolean;
}

export interface RoomCounts {
  disponible: number;
  ocupada: number;
  limpieza: number;
  mantenimiento: number;
}

export interface Hotel {
  id: string;
  name: string;
  kind: string;
  city: string;
  zone: string;
  image: string;
  description: string;
  address: string;
  phone: string;
  whatsapp: string;
  counts: RoomCounts;
  rooms: Room[];
}

export interface HotelProfile {
  name: string;
  kind: 'hotel' | 'residencia' | 'motel';
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  description: string;
}

export interface AuthUser {
  id: string;
  establecimiento_id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string | null;
  roles: string[];
}

export type PublicRoute =
  | { page: 'home' }
  | { page: 'search' }
  | { page: 'hotel'; id: string }
  | { page: 'admin' }
  | { page: 'login' }
  | { page: 'register' };
