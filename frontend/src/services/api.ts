import type { AuthUser, Hotel, HotelProfile, Room, RoomStatus } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const AUTH_TOKEN_KEY = 'hospedado-access-token';

export interface AuthResult {
  token: string;
  expiresIn: number;
  user: AuthUser;
}

export interface CompanyRegistration {
  razon_social: string;
  tipo_documento: string;
  numero_documento: string;
  correo_contacto: string;
  telefono?: string;
}

export interface EstablishmentRegistration {
  nombre_comercial: string;
  tipo_establecimiento: 'hotel' | 'residencia' | 'motel';
  municipio_id?: string | null;
  direccion?: string;
  telefono?: string;
  whatsapp?: string;
  correo?: string;
  descripcion?: string;
}

export interface AdministratorRegistration {
  nombres: string;
  apellidos: string;
  correo: string;
  password: string;
  telefono?: string;
}

export interface RegistrationPayload {
  empresa: CompanyRegistration;
  establecimiento: EstablishmentRegistration;
  administrador: AdministratorRegistration;
}

interface ApiRate {
  modalidad: string;
  duracion_minutos: number | null;
  precio: string | number;
  moneda: string;
}

interface ApiRoom {
  id: string;
  numero: string;
  ubicacion: string;
  estado: RoomStatus;
  minibar: boolean;
  resena: string | null;
  contenido: string[];
  tarifas: ApiRate[];
}

interface ApiPublicRoom {
  ubicacion: string;
  minibar: boolean;
  resena: string | null;
  contenido: string[];
  tarifas: ApiRate[];
}

interface ApiPublicEstablishment {
  id: string;
  nombre_comercial: string;
  tipo_establecimiento: string;
  direccion: string | null;
  latitud: string | number | null;
  longitud: string | number | null;
  telefono: string | null;
  whatsapp: string | null;
  correo: string | null;
  logo_url: string | null;
  descripcion: string | null;
  municipio: string | null;
  division_territorial: string | null;
  resumen_habitaciones: Record<string, number | string>;
  habitaciones_disponibles?: ApiPublicRoom[];
}

export interface ApiEstablishment {
  id: string;
  empresa_id: string;
  nombre_comercial: string;
  tipo_establecimiento: HotelProfile['kind'];
  municipio_id: string | null;
  division_territorial_id: string | null;
  direccion: string | null;
  latitud: number | string | null;
  longitud: number | string | null;
  telefono: string | null;
  whatsapp: string | null;
  correo: string | null;
  logo_url: string | null;
  descripcion: string | null;
  visible_publicamente: boolean;
}

export interface ApiRoomGroup {
  id: string;
  nombre: string;
  ubicacion: string;
  minibar: boolean;
  resena: string | null;
  contenido: string[];
  tarifas: ApiRate[];
}

export interface RoomGroupPayload {
  nombre: string;
  ubicacion: string;
  minibar: boolean;
  resena: string | null;
  contenido: string[];
  tarifas: { modalidad: string; precio: number; moneda: string }[];
}

export interface InventoryStock {
  ubicacion_id: string;
  ubicacion: string;
  tipo: 'bodega' | 'minibar' | 'tienda';
  cantidad: string | number;
}

export interface OperationProduct {
  id: string;
  nombre: string;
  categoria: 'minibar' | 'tienda' | 'general';
  unidad: string;
  costo: string | number;
  precio_venta: string | number;
  stock_minimo: string | number;
  activo: boolean;
  updated_at?: string;
  existencias: InventoryStock[];
}

export interface InventoryItem {
  producto_id: string;
  producto: string;
  unidad: string;
  cantidad: string | number;
}

export interface InventoryLocation {
  id: string;
  nombre: string;
  tipo: 'bodega' | 'minibar' | 'tienda';
  habitacion_id: string | null;
  habitacion: string | null;
  existencias: InventoryItem[];
}

export interface InventoryMovement {
  id: string;
  tipo: 'ingreso' | 'ajuste' | 'traslado' | 'venta' | 'consumo';
  cantidad: string | number;
  nota: string | null;
  created_at: string;
  producto: string;
  origen: string | null;
  destino: string | null;
  usuario: string | null;
}

export interface StayCharge {
  id: string;
  tipo: 'alojamiento' | 'minibar' | 'tienda';
  descripcion: string;
  cantidad: string | number;
  precio_unitario: string | number;
  total: string | number;
  created_at?: string;
}

export interface ActiveStay {
  id: string;
  habitacion_id: string;
  habitacion: string;
  ubicacion: string;
  huesped_id: string;
  nombres: string;
  apellidos: string;
  tipo_documento: string | null;
  numero_documento: string | null;
  telefono: string | null;
  tarifa_noche: string | number;
  entrada_at: string;
  cargos: StayCharge[];
}

export interface RevenueReport {
  desde: string;
  hasta: string;
  alojamiento: { total: number; operaciones: number };
  minibar: { total: number; operaciones: number };
  tienda: { total: number; operaciones: number };
  total: number;
}

export interface CashSummary {
  desde_at: string;
  hasta_at: string;
  efectivo: string | number;
  tarjeta: string | number;
  transferencia: string | number;
  operaciones: number;
}

export interface CashClose {
  id: string;
  desde_at: string;
  hasta_at: string;
  efectivo_esperado: string | number;
  tarjeta_esperada: string | number;
  transferencia_esperada: string | number;
  efectivo_declarado: string | number;
  diferencia_efectivo: string | number;
  operaciones: number;
  created_at: string;
}

let accessToken = localStorage.getItem(AUTH_TOKEN_KEY);

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  else localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function hasAccessToken() {
  return Boolean(accessToken);
}

export function saveAuthResult(result: AuthResult) {
  setAccessToken(result.token);
}

async function request<T>(path: string, options: RequestInit = {}, authenticated = true): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body) headers.set('Content-Type', 'application/json');
  if (authenticated && accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (error) {
    console.error('No se pudo conectar con la API de Hotel En.com.', error);
    throw new ApiError('No se pudo conectar con el servidor. Verifica que el backend esté iniciado.', 0);
  }

  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json() as { error?: string } & T
    : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'object' && payload !== null && 'error' in payload
      ? payload.error
      : response.status >= 500
        ? 'No se pudo conectar con la API de Hotel En.com. Verifica que el backend esté iniciado y que PostgreSQL esté disponible.'
        : `La solicitud falló (${response.status}).`;
    throw new ApiError(message || `La solicitud falló (${response.status}).`, response.status);
  }
  return payload as T;
}

function priceText(rates: ApiRate[] = []) {
  if (rates.length === 0) return 'Consultar tarifa';
  const rate = rates[0];
  const amount = Number(rate.precio);
  if (!Number.isFinite(amount)) return 'Consultar tarifa';
  return `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(amount)} ${rate.moneda}`;
}

export function mapApiRoom(room: ApiRoom): Room {
  return {
    id: room.id,
    number: room.numero,
    type: room.resena || room.ubicacion || 'Habitación',
    detail: [...(room.contenido || []), room.minibar ? 'Minibar' : ''].filter(Boolean).join(' · ')
      || room.resena
      || 'Consulta las características con el hotel.',
    price: priceText(room.tarifas),
    status: room.estado,
    minibar: room.minibar,
  };
}

function mapPublicRoom(room: ApiPublicRoom, index: number): Room {
  return {
    number: `Disponible ${index + 1}`,
    type: room.resena || room.ubicacion || 'Habitación disponible',
    detail: [...(room.contenido || []), room.minibar ? 'Minibar' : ''].filter(Boolean).join(' · ')
      || room.resena
      || 'Consulta las características con el hotel.',
    price: priceText(room.tarifas),
    status: 'disponible',
  };
}

export function mapPublicEstablishment(item: ApiPublicEstablishment): Hotel {
  const city = [item.municipio, item.division_territorial].filter(Boolean).join(', ')
    || item.direccion
    || 'Ubicación por confirmar';
  return {
    id: item.id,
    name: item.nombre_comercial,
    kind: item.tipo_establecimiento.replaceAll('_', ' ').toLocaleUpperCase(),
    city,
    zone: item.division_territorial || item.municipio || city,
    image: item.logo_url || 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85',
    description: item.descripcion || 'Comunícate directamente con el establecimiento para conocer más.',
    address: item.direccion || '',
    phone: item.telefono || '',
    whatsapp: (item.whatsapp || item.telefono || '').replace(/\D/g, ''),
    counts: {
      disponible: Number(item.resumen_habitaciones.disponible) || 0,
      ocupada: Number(item.resumen_habitaciones.ocupada) || 0,
      limpieza: Number(item.resumen_habitaciones.limpieza) || 0,
      mantenimiento: Number(item.resumen_habitaciones.mantenimiento) || 0,
    },
    rooms: (item.habitaciones_disponibles || []).map(mapPublicRoom),
  };
}

export function mapApiEstablishment(item: ApiEstablishment): HotelProfile {
  return {
    name: item.nombre_comercial,
    kind: item.tipo_establecimiento,
    address: item.direccion || '',
    phone: item.telefono || '',
    whatsapp: item.whatsapp || item.telefono || '',
    email: item.correo || '',
    description: item.descripcion || '',
  };
}

export const api = {
  login: (correo: string, password: string) => request<AuthResult>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ correo, password }) },
    false,
  ),
  register: (payload: RegistrationPayload) => request<AuthResult & {
    establecimiento: ApiEstablishment;
  }>('/onboarding', { method: 'POST', body: JSON.stringify(payload) }, false),
  me: () => request<AuthUser>('/auth/me'),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  searchHotels: async (query: string) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    const search = params.size ? `?${params.toString()}` : '';
    const items = await request<ApiPublicEstablishment[]>(`/public/establecimientos${search}`, {}, false);
    return items.map(mapPublicEstablishment);
  },
  getPublicHotel: async (id: string) => {
    const item = await request<ApiPublicEstablishment>(
      `/public/establecimientos/${encodeURIComponent(id)}`,
      {},
      false,
    );
    return mapPublicEstablishment(item);
  },
  getEstablishment: () => request<ApiEstablishment>('/establecimiento'),
  updateEstablishment: (values: Record<string, unknown>) => request<ApiEstablishment>(
    '/establecimiento',
    { method: 'PUT', body: JSON.stringify(values) },
  ),
  getRoomSummary: () => request<{
    total: number;
    disponibles: number;
    ocupadas: number;
    limpieza: number;
    mantenimiento: number;
    inactivas: number;
  }>('/habitaciones/resumen'),
  listRooms: async () => {
    const items = await request<ApiRoom[]>('/habitaciones');
    return items.map(mapApiRoom);
  },
  createRoom: async (values: Record<string, unknown>) => {
    const item = await request<ApiRoom>('/habitaciones', {
      method: 'POST',
      body: JSON.stringify(values),
    });
    return mapApiRoom(item);
  },
  updateRoom: async (id: string, values: Record<string, unknown>) => {
    const item = await request<ApiRoom>(`/habitaciones/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(values),
    });
    return mapApiRoom(item);
  },
  listRoomGroups: () => request<ApiRoomGroup[]>('/habitaciones/grupos'),
  createRoomGroup: (values: RoomGroupPayload) => request<ApiRoomGroup>(
    '/habitaciones/grupos',
    { method: 'POST', body: JSON.stringify(values) },
  ),
  createRoomsFromGroup: (groupId: string, numbers: string[]) => request<ApiRoom[]>(
    `/habitaciones/grupos/${encodeURIComponent(groupId)}/habitaciones`,
    { method: 'POST', body: JSON.stringify({ numeros: numbers }) },
  ),
  listOperationProducts: () => request<OperationProduct[]>('/operaciones/productos'),
  createOperationProduct: (values: Record<string, unknown>) => request<OperationProduct>(
    '/operaciones/productos',
    { method: 'POST', body: JSON.stringify(values) },
  ),
  updateOperationProduct: (id: string, values: Record<string, unknown>) => request<OperationProduct>(
    `/operaciones/productos/${encodeURIComponent(id)}`,
    { method: 'PUT', body: JSON.stringify(values) },
  ),
  listInventoryLocations: () => request<InventoryLocation[]>('/operaciones/ubicaciones'),
  createInventoryLocation: (values: Record<string, unknown>) => request<InventoryLocation>(
    '/operaciones/ubicaciones',
    { method: 'POST', body: JSON.stringify(values) },
  ),
  listInventoryMovements: () => request<InventoryMovement[]>('/operaciones/movimientos'),
  changeInventoryStock: (values: Record<string, unknown>) => request(
    '/operaciones/movimientos',
    { method: 'POST', body: JSON.stringify(values) },
  ),
  transferInventory: (values: Record<string, unknown>) => request(
    '/operaciones/traslados',
    { method: 'POST', body: JSON.stringify(values) },
  ),
  listActiveStays: () => request<ActiveStay[]>('/operaciones/estadias'),
  checkIn: (values: Record<string, unknown>) => request<ActiveStay>(
    '/operaciones/estadias',
    { method: 'POST', body: JSON.stringify(values) },
  ),
  addStayCharge: (stayId: string, values: Record<string, unknown>) => request<StayCharge>(
    `/operaciones/estadias/${encodeURIComponent(stayId)}/cargos`,
    { method: 'POST', body: JSON.stringify(values) },
  ),
  checkout: (stayId: string, medio_pago: string) => request<{
    estadia_id: string;
    habitacion: string;
    noches: number;
    cargo_alojamiento: string | number;
    total: string | number;
    pago: { monto: string | number; medio_pago: string };
  }>(`/operaciones/estadias/${encodeURIComponent(stayId)}/cierre`, {
    method: 'POST',
    body: JSON.stringify({ medio_pago }),
  }),
  createStoreSale: (values: Record<string, unknown>) => request(
    '/operaciones/ventas',
    { method: 'POST', body: JSON.stringify(values) },
  ),
  getRevenue: (from: string, to: string) => {
    const params = new URLSearchParams({ desde: from, hasta: to });
    return request<RevenueReport>(`/operaciones/ingresos?${params.toString()}`);
  },
  getCashSummary: () => request<CashSummary>('/operaciones/caja/actual'),
  closeCash: (efectivoDeclarado: number, nota: string) => request<CashClose>(
    '/operaciones/caja/cierre',
    { method: 'POST', body: JSON.stringify({ efectivo_declarado: efectivoDeclarado, nota }) },
  ),
};

export function establishmentUpdatePayload(profile: HotelProfile, visible: boolean) {
  return {
    nombre_comercial: profile.name,
    tipo_establecimiento: profile.kind,
    direccion: profile.address || null,
    telefono: profile.phone || null,
    whatsapp: profile.whatsapp || null,
    correo: profile.email || null,
    descripcion: profile.description || null,
    visible_publicamente: visible,
  };
}

export function hotelProfileFromRegistration(
  establishment: EstablishmentRegistration,
): HotelProfile {
  return {
    name: establishment.nombre_comercial,
    kind: establishment.tipo_establecimiento,
    address: establishment.direccion || '',
    phone: establishment.telefono || '',
    whatsapp: establishment.telefono || '',
    email: establishment.correo || '',
    description: establishment.descripcion || '',
  };
}
