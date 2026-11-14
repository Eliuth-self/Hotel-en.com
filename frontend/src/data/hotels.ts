import type { Hotel, HotelProfile, Room } from '../types';

export const hotelImages = {
  hero: 'https://images.unsplash.com/photo-1601918774946-25832a4be0d6?auto=format&fit=crop&w=2000&q=85',
  olive: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85',
  room: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=900&q=85',
  blue: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85',
  forest: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=85',
};

export const initialRooms: Room[] = [
  { number: 'Jardín 101', type: 'Habitación jardín', detail: 'Queen · 2 huéspedes · Wi-Fi incluido', price: '$1,450 MXN', status: 'disponible' },
  { number: 'Suite Olivo', type: 'Suite', detail: 'King · 2 huéspedes · Terraza privada', price: '$2,350 MXN', status: 'disponible' },
  { number: 'Terraza 102', type: 'Habitación terraza', detail: 'Queen · 2 huéspedes · Vista al centro', price: '$1,850 MXN', status: 'ocupada' },
  { number: 'Patio 103', type: 'Habitación patio', detail: 'Doble · 2 huéspedes · Patio interior', price: '$1,650 MXN', status: 'limpieza' },
  { number: 'Nube 104', type: 'Suite', detail: 'King · 2 huéspedes · Balcón', price: '$2,150 MXN', status: 'mantenimiento' },
];

export const initialHotels: Hotel[] = [
  {
    id: 'casa-olivo',
    name: 'Casa Olivo',
    kind: 'HOTEL BOUTIQUE',
    city: 'Oaxaca de Juárez, Oaxaca',
    zone: 'Centro de Oaxaca',
    image: hotelImages.olive,
    description: 'Un refugio de inspiración artesanal en el corazón de Oaxaca. Descansa entre patios verdes, textiles locales y una hospitalidad que se siente como en casa.',
    address: 'Calle de la Reforma 24, Centro',
    phone: '+52 951 000 0000',
    whatsapp: '529510000000',
    counts: { disponible: 12, ocupada: 8, limpieza: 2, mantenimiento: 1 },
    rooms: initialRooms,
  },
  {
    id: 'brisa-azul',
    name: 'Brisa Azul',
    kind: 'FRENTE AL MAR',
    city: 'Puerto Escondido, Oaxaca',
    zone: 'Playa Zicatela',
    image: hotelImages.blue,
    description: 'Días tranquilos junto al Pacífico, habitaciones luminosas y una terraza para disfrutar la brisa del mar.',
    address: 'Av. del Morro 18, Zicatela',
    phone: '+52 954 000 0000',
    whatsapp: '529540000000',
    counts: { disponible: 4, ocupada: 6, limpieza: 3, mantenimiento: 1 },
    rooms: [
      { number: 'Mar 201', type: 'Vista al mar', detail: 'King · 2 huéspedes · Balcón', price: '$2,100 MXN', status: 'disponible' },
      { number: 'Palma 105', type: 'Habitación palma', detail: 'Queen · 2 huéspedes · Jardín', price: '$1,600 MXN', status: 'disponible' },
    ],
  },
  {
    id: 'refugio-bosque',
    name: 'Refugio del Bosque',
    kind: 'ENTRE MONTAÑAS',
    city: 'San José del Pacífico, Oaxaca',
    zone: 'Sierra Sur',
    image: hotelImages.forest,
    description: 'Cabañas acogedoras entre pinos, mañanas frescas y senderos para desconectarse en plena naturaleza.',
    address: 'Camino a San Mateo, km 3',
    phone: '+52 951 100 0000',
    whatsapp: '529511000000',
    counts: { disponible: 4, ocupada: 7, limpieza: 3, mantenimiento: 2 },
    rooms: [
      { number: 'Pino 03', type: 'Cabaña bosque', detail: 'Cama doble · 2 huéspedes · Chimenea', price: '$1,300 MXN', status: 'disponible' },
      { number: 'Nube 04', type: 'Cabaña mirador', detail: 'King · 2 huéspedes · Balcón', price: '$1,800 MXN', status: 'disponible' },
    ],
  },
  {
    id: 'posada-nube',
    name: 'Posada Nube',
    kind: 'CASA DE MONTAÑA',
    city: 'Oaxaca de Juárez, Oaxaca',
    zone: 'Barrio de Xochimilco',
    image: hotelImages.olive,
    description: 'Una casa tranquila de inspiración oaxaqueña, con espacios luminosos y una terraza para disfrutar la ciudad.',
    address: 'Calle del Mirador 16, Xochimilco',
    phone: '+52 951 200 0000',
    whatsapp: '529512000000',
    counts: { disponible: 3, ocupada: 4, limpieza: 1, mantenimiento: 0 },
    rooms: [
      { number: 'Nube 01', type: 'Habitación terraza', detail: 'Queen · 2 huéspedes · Vista a la ciudad', price: '$1,250 MXN', status: 'disponible' },
      { number: 'Nube 02', type: 'Suite familiar', detail: 'Dos camas · 4 huéspedes · Sala privada', price: '$1,950 MXN', status: 'disponible' },
    ],
  },
];

export const initialHotelProfile: HotelProfile = {
  name: 'Casa Olivo',
  kind: 'hotel',
  address: 'Calle de la Reforma 24, Centro',
  phone: '+52 951 000 0000',
  whatsapp: '+52 951 000 0000',
  email: 'reservas@casaolivo.example',
  description: 'Un refugio de inspiración artesanal en el corazón de Oaxaca. Descansa entre patios verdes y textiles locales.',
};
