import { useEffect, useState } from 'react';
import { useToast } from '../hooks/useToast';
import type { HotelProfile, Room, RoomStatus } from '../types';
import { findDuplicateRoomNumbers } from '../utils/search';
import {
  ApiError,
  api,
  type CashClose,
  type CashSummary,
  establishmentUpdatePayload,
  mapApiEstablishment,
  mapApiRoom,
  type ApiRoomGroup,
  type ActiveStay,
  type InventoryLocation,
  type InventoryMovement,
  type OperationProduct,
  type RevenueReport,
  type RoomGroupPayload,
} from '../services/api';
import { RoomGroupDialog } from '../components/RoomGroupDialog';
import { Toast } from '../components/Toast';
import { AdminLayout, type AdminTab } from '../components/admin/AdminLayout';
import { DashboardTab } from '../components/admin/DashboardTab';
import { RoomsTab } from '../components/admin/RoomsTab';
import { SettingsTab } from '../components/admin/SettingsTab';
import { RoomEditorDialog } from '../components/admin/RoomEditorDialog';
import { OperationsTab } from '../components/admin/OperationsTab';

function localDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const emptyProfile: HotelProfile = {
  name: '',
  kind: 'hotel',
  address: '',
  phone: '',
  whatsapp: '',
  email: '',
  description: '',
};

function errorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : 'No se pudo completar la operación. Inténtalo de nuevo.';
}

export function AdminPage({ onLogout, userRoles }: { onLogout: () => void; userRoles: string[] }) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [profile, setProfile] = useState(emptyProfile);
  const [publicEnabled, setPublicEnabled] = useState(false);
  const [establishmentId, setEstablishmentId] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [groups, setGroups] = useState<ApiRoomGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [operationsError, setOperationsError] = useState('');
  const [operationsReload, setOperationsReload] = useState(0);
  const [operationProducts, setOperationProducts] = useState<OperationProduct[]>([]);
  const [inventoryLocations, setInventoryLocations] = useState<InventoryLocation[]>([]);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [activeStays, setActiveStays] = useState<ActiveStay[]>([]);
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [cashSummary, setCashSummary] = useState<CashSummary | null>(null);
  const { message, showToast } = useToast();

  useEffect(() => {
    let active = true;
    Promise.all([api.getEstablishment(), api.listRooms(), api.listRoomGroups()])
      .then(([establishment, currentRooms, currentGroups]) => {
        if (!active) return;
        setProfile(mapApiEstablishment(establishment));
        setPublicEnabled(establishment.visible_publicamente);
        setEstablishmentId(establishment.id);
        setRooms(currentRooms);
        setGroups(currentGroups);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(errorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (activeTab !== 'operations') return undefined;
    let active = true;
    setOperationsLoading(true);
    setOperationsError('');
    const now = new Date();
    const from = localDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const to = localDate(now);
    Promise.all([
      api.listOperationProducts(),
      api.listInventoryLocations(),
      api.listInventoryMovements(),
      api.listActiveStays(),
      api.getRevenue(from, to),
      api.getCashSummary(),
    ])
      .then(([products, locations, movements, stays, currentRevenue, currentCash]) => {
        if (!active) return;
        setOperationProducts(products);
        setInventoryLocations(locations);
        setInventoryMovements(movements);
        setActiveStays(stays);
        setRevenue(currentRevenue);
        setCashSummary(currentCash);
      })
      .catch((error: unknown) => {
        if (active) setOperationsError(errorMessage(error));
      })
      .finally(() => {
        if (active) setOperationsLoading(false);
      });
    return () => { active = false; };
  }, [activeTab, operationsReload]);

  async function refreshOperations() {
    const now = new Date();
    const from = localDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const to = localDate(now);
    const [products, locations, movements, stays, currentRevenue, currentCash] = await Promise.all([
      api.listOperationProducts(),
      api.listInventoryLocations(),
      api.listInventoryMovements(),
      api.listActiveStays(),
      api.getRevenue(from, to),
      api.getCashSummary(),
    ]);
    setOperationProducts(products);
    setInventoryLocations(locations);
    setInventoryMovements(movements);
    setActiveStays(stays);
    setRevenue(currentRevenue);
    setCashSummary(currentCash);
  }

  async function runOperation(action: () => Promise<unknown>, successMessage: string) {
    try {
      await action();
    } catch (error) {
      showToast(errorMessage(error));
      return false;
    }
    try {
      await refreshOperations();
      showToast(successMessage);
    } catch (error) {
      showToast(`Se guardó la operación, pero no se pudieron actualizar los datos: ${errorMessage(error)}`);
    }
    return true;
  }

  async function loadRevenue(from: string, to: string) {
    try {
      setRevenue(await api.getRevenue(from, to));
    } catch (error) {
      showToast(errorMessage(error));
    }
  }

  async function closeCash(declaredCash: number, note: string): Promise<CashClose | null> {
    let closing: CashClose;
    try {
      closing = await api.closeCash(declaredCash, note);
    } catch (error) {
      showToast(errorMessage(error));
      return null;
    }
    try {
      await refreshOperations();
    } catch (error) {
      showToast(`Caja cerrada; no se pudieron actualizar los datos: ${errorMessage(error)}`);
      return closing;
    }
    const difference = Number(closing.diferencia_efectivo);
    showToast(`Caja cerrada. Diferencia de efectivo: ${new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(difference)}.`);
    return closing;
  }

  async function saveSettings(nextProfile: HotelProfile, nextVisibility: boolean) {
    try {
      const establishment = await api.updateEstablishment(
        establishmentUpdatePayload(nextProfile, nextVisibility),
      );
      setProfile(mapApiEstablishment(establishment));
      setPublicEnabled(establishment.visible_publicamente);
      showToast('Perfil del hotel guardado.');
    } catch (error) {
      showToast(errorMessage(error));
    }
  }

  async function updateRoomStatus(index: number, status: RoomStatus) {
    const room = rooms[index];
    if (!room?.id) {
      showToast('No se pudo identificar la habitación para actualizarla.');
      return;
    }
    try {
      const updatedRoom = await api.updateRoom(room.id, { estado: status });
      setRooms((current) => current.map((item) => item.id === updatedRoom.id ? updatedRoom : item));
      showToast('Estado de habitación actualizado.');
    } catch (error) {
      showToast(errorMessage(error));
    }
  }

  async function enableRoomMinibar(index: number) {
    const room = rooms[index];
    if (!room?.id || room.minibar) return;
    try {
      const updatedRoom = await api.updateRoom(room.id, { minibar: true });
      setRooms((current) => current.map((item) => item.id === updatedRoom.id ? updatedRoom : item));
      showToast(`Minibar activado para la habitación ${room.number}.`);
    } catch (error) {
      showToast(errorMessage(error));
    }
  }

  async function createRooms(values: {
    groupId?: string;
    group?: RoomGroupPayload;
    numbers: string[];
  }) {
    const { numbers } = values;
    if (numbers.length === 0 || numbers.length > 500) {
      showToast('Indica entre 1 y 500 números de habitación.');
      return;
    }
    if (new Set(numbers.map((number) => number.toLocaleLowerCase())).size !== numbers.length) {
      showToast('No repitas números en el mismo lote.');
      return;
    }
    const duplicates = findDuplicateRoomNumbers(rooms, numbers);
    if (duplicates.length > 0) {
      showToast(`Ya existe: ${duplicates.slice(0, 3).join(', ')}. No se creó ninguna habitación.`);
      return;
    }
    try {
      let groupId = values.groupId;
      if (!groupId && values.group) {
        const group = await api.createRoomGroup(values.group);
        groupId = group.id;
        setGroups((current) => [...current, group]);
      }
      if (!groupId) {
        showToast('Selecciona o crea una plantilla para las habitaciones.');
        return;
      }
      const created = await api.createRoomsFromGroup(groupId, numbers);
      const additions = created.map(mapApiRoom);
      setRooms((current) => [...current, ...additions]);
      setGroupDialogOpen(false);
      setActiveTab('rooms');
      showToast(`${additions.length} ${additions.length === 1 ? 'habitación creada' : 'habitaciones creadas'}.`);
    } catch (error) {
      showToast(errorMessage(error));
    }
  }

  async function addRoom(values: {
    number: string;
    type: string;
    location: string;
    price: number;
    contents: string[];
    minibar: boolean;
  }) {
    if (findDuplicateRoomNumbers(rooms, [values.number]).length > 0) {
      showToast('Ya existe una habitación con ese número.');
      return;
    }
    try {
      const created = await api.createRoom({
        numero: values.number,
        ubicacion: values.location,
        minibar: values.minibar,
        resena: values.type,
        contenido: values.contents,
        tarifas: [{ modalidad: 'Noche', precio: values.price, moneda: 'COP' }],
      });
      setRooms((current) => [...current, created]);
      setRoomDialogOpen(false);
      showToast('Habitación agregada.');
    } catch (error) {
      showToast(errorMessage(error));
    }
  }

  if (loading) {
    return <main className="auth-page"><p role="status">Cargando el panel del hotel…</p></main>;
  }
  if (loadError) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p className="form-error" role="alert">{loadError}</p>
          <button className="button button-outline" onClick={onLogout}>Cerrar sesión</button>
        </section>
      </main>
    );
  }

  return (
    <>
      <AdminLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hotelName={profile.name}
        hotelId={establishmentId}
        onLogout={onLogout}
        userRoles={userRoles}
      >
        {activeTab === 'dashboard' && <DashboardTab rooms={rooms} publicEnabled={publicEnabled} hotelName={profile.name} onTabChange={setActiveTab} />}
        {activeTab === 'rooms' && <RoomsTab rooms={rooms} onStatusChange={updateRoomStatus} onEnableMinibar={enableRoomMinibar} onAddRoom={() => setRoomDialogOpen(true)} onCreateGroup={() => setGroupDialogOpen(true)} />}
        {activeTab === 'settings' && <SettingsTab profile={profile} publicEnabled={publicEnabled} onSave={saveSettings} />}
        {activeTab === 'operations' && (operationsLoading ? (
          <p role="status">Cargando inventario y estadías…</p>
        ) : operationsError ? (
          <section className="admin-panel">
            <p className="form-error" role="alert">{operationsError}</p>
            <button type="button" className="button button-outline" onClick={() => setOperationsReload((current) => current + 1)}>Reintentar</button>
          </section>
        ) : (
          <OperationsTab
            products={operationProducts}
            locations={inventoryLocations}
            movements={inventoryMovements}
            stays={activeStays}
            rooms={rooms}
            revenue={revenue}
            cashSummary={cashSummary}
            canCloseCash={userRoles.some((role) => ['administrador', 'cajero', 'recepcionista', 'inventario'].includes(role))}
            onCreateProduct={(values) => runOperation(
              () => api.createOperationProduct(values),
              'Producto creado.',
            )}
            onUpdateProduct={(id, values) => runOperation(
              () => api.updateOperationProduct(id, values),
              'Producto actualizado.',
            )}
            onCreateLocation={(values) => runOperation(
              () => api.createInventoryLocation(values),
              'Ubicación creada.',
            )}
            onChangeStock={(values) => runOperation(
              () => api.changeInventoryStock(values),
              'Movimiento de inventario registrado.',
            )}
            onTransferStock={(values) => runOperation(
              () => api.transferInventory(values),
              'Traslado de inventario registrado.',
            )}
            onCheckIn={(values) => runOperation(
              () => api.checkIn(values),
              'Check-in registrado.',
            )}
            onAddCharge={(stayId, values) => runOperation(
              () => api.addStayCharge(stayId, values),
              'Consumo agregado a la cuenta.',
            )}
            onCheckout={(stayId, method) => runOperation(
              () => api.checkout(stayId, method),
              'Estadía cerrada y pago registrado.',
            )}
            onCreateSale={(values) => runOperation(
              () => api.createStoreSale(values),
              'Venta registrada y cobrada.',
            )}
            onLoadRevenue={loadRevenue}
            onCloseCash={closeCash}
          />
        ))}
      </AdminLayout>
      <RoomGroupDialog open={groupDialogOpen} groups={groups} onClose={() => setGroupDialogOpen(false)} onCreate={createRooms} />
      <RoomEditorDialog open={roomDialogOpen} onClose={() => setRoomDialogOpen(false)} onCreate={addRoom} />
      <Toast message={message} />
    </>
  );
}
