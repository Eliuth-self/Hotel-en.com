import { useMemo, useState, type FormEvent } from 'react';
import type { Room } from '../../types';
import type {
  ActiveStay,
  CashClose,
  CashSummary,
  InventoryLocation,
  InventoryMovement,
  OperationProduct,
  RevenueReport,
} from '../../services/api';

type OperationsSection = 'inventory' | 'stays' | 'sales' | 'income' | 'cash';
type OperationAction = (values: Record<string, unknown>) => Promise<boolean>;

interface OperationsTabProps {
  products: OperationProduct[];
  locations: InventoryLocation[];
  movements: InventoryMovement[];
  stays: ActiveStay[];
  rooms: Room[];
  revenue: RevenueReport | null;
  cashSummary: CashSummary | null;
  canCloseCash: boolean;
  onCreateProduct: OperationAction;
  onUpdateProduct: (id: string, values: Record<string, unknown>) => Promise<boolean>;
  onCreateLocation: OperationAction;
  onChangeStock: OperationAction;
  onTransferStock: OperationAction;
  onCheckIn: OperationAction;
  onAddCharge: (stayId: string, values: Record<string, unknown>) => Promise<boolean>;
  onCheckout: (stayId: string, paymentMethod: string) => Promise<boolean>;
  onCreateSale: OperationAction;
  onLoadRevenue: (from: string, to: string) => Promise<void>;
  onCloseCash: (declaredCash: number, note: string) => Promise<CashClose | null>;
}

const money = (value: string | number) => new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
}).format(Number(value) || 0);

const dateTime = (value: string) => new Date(value).toLocaleString('es-CO', {
  dateStyle: 'short',
  timeStyle: 'short',
});

function localDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const sectionLabels: Record<OperationsSection, string> = {
  inventory: 'Inventario',
  stays: 'Recepción y estadías',
  sales: 'Ventas de tienda',
  income: 'Ingresos',
  cash: 'Cierre de caja',
};

function ProductForm({ onCreate }: { onCreate: OperationAction }) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (await onCreate({
      nombre: String(form.get('nombre')),
      categoria: String(form.get('categoria')),
      unidad: String(form.get('unidad')),
      costo: Number(form.get('costo')),
      precio_venta: Number(form.get('precio_venta')),
    })) formElement.reset();
  }

  return (
    <form className="ops-form" onSubmit={submit}>
      <h3>Nuevo producto</h3>
      <label>Nombre<input name="nombre" required maxLength={180} placeholder="Agua 600 ml" /></label>
      <div className="ops-form-row">
        <label>Categoría
          <select name="categoria"><option value="minibar">Minibar</option><option value="tienda">Tienda</option><option value="general">General</option></select>
        </label>
        <label>Unidad<input name="unidad" defaultValue="unidad" required maxLength={40} /></label>
      </div>
      <div className="ops-form-row">
        <label>Costo unitario<input name="costo" type="number" min="0" step="0.01" required /></label>
        <label>Precio de venta<input name="precio_venta" type="number" min="0.01" step="0.01" required /></label>
      </div>
      <label>Alerta de stock bajo<input name="stock_minimo" type="number" min="0" step="0.001" defaultValue="0" required /></label>
      <button className="button button-primary" type="submit">Guardar producto</button>
    </form>
  );
}

function ProductEditForm({ product, onUpdate }: {
  product: OperationProduct;
  onUpdate: OperationsTabProps['onUpdateProduct'];
}) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (await onUpdate(product.id, {
      nombre: String(form.get('nombre')),
      categoria: String(form.get('categoria')),
      unidad: String(form.get('unidad')),
      costo: Number(form.get('costo')),
      precio_venta: Number(form.get('precio_venta')),
      stock_minimo: Number(form.get('stock_minimo')),
    })) formElement.reset();
  }

  return (
    <details className="ops-product-edit">
      <summary>Editar producto y precios</summary>
      <form className="ops-form" onSubmit={submit}>
        <label>Nombre<input name="nombre" defaultValue={product.nombre} required maxLength={180} /></label>
        <label>Categoría<select name="categoria" defaultValue={product.categoria}><option value="minibar">Minibar</option><option value="tienda">Tienda</option><option value="general">General</option></select></label>
        <label>Unidad<input name="unidad" defaultValue={product.unidad} required maxLength={40} /></label>
        <div className="ops-form-row">
          <label>Costo unitario<input name="costo" type="number" min="0" step="0.01" defaultValue={product.costo} required /></label>
          <label>Precio de venta<input name="precio_venta" type="number" min="0.01" step="0.01" defaultValue={product.precio_venta} required /></label>
        </div>
        <label>Alerta de stock bajo<input name="stock_minimo" type="number" min="0" step="0.001" defaultValue={product.stock_minimo} required /></label>
        <button className="button button-outline" type="submit">Guardar cambios</button>
      </form>
    </details>
  );
}

function LocationForm({ rooms, onCreate }: {
  rooms: Room[];
  onCreate: OperationAction;
}) {
  const [type, setType] = useState('bodega');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (!await onCreate({
      nombre: String(form.get('nombre')),
      tipo: type,
      ...(type === 'minibar' ? { habitacion_id: String(form.get('habitacion_id')) } : {}),
    })) return;
    formElement.reset();
    setType('bodega');
  }

  return (
    <form className="ops-form" onSubmit={submit}>
      <h3>Nueva ubicación de stock</h3>
      <label>Tipo
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="bodega">Bodega</option><option value="tienda">Tienda</option><option value="minibar">Minibar de habitación</option>
        </select>
      </label>
      {type === 'minibar' && (
        <label>Habitación
          <select name="habitacion_id" required defaultValue="">
            <option value="" disabled>Selecciona una habitación con minibar</option>
            {rooms.filter((room) => room.status !== 'inactiva' && room.minibar).map((room) => (
              <option value={room.id} key={room.id}>{room.number} · {room.type}</option>
            ))}
          </select>
        </label>
      )}
      <label>Nombre<input name="nombre" required maxLength={180} placeholder={type === 'minibar' ? 'Minibar 101' : 'Bodega principal'} /></label>
      <button className="button button-outline" type="submit">Crear ubicación</button>
    </form>
  );
}

function StockForms({ products, locations, onChange, onTransfer }: {
  products: OperationProduct[];
  locations: InventoryLocation[];
  onChange: OperationAction;
  onTransfer: OperationAction;
}) {
  const [movementType, setMovementType] = useState('ingreso');
  async function submitStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (await onChange({
      producto_id: String(form.get('producto_id')),
      ubicacion_id: String(form.get('ubicacion_id')),
      tipo: movementType,
      cantidad: Number(form.get('cantidad')),
      nota: String(form.get('nota') || ''),
    })) formElement.reset();
  }
  async function submitTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (await onTransfer({
      producto_id: String(form.get('producto_id')),
      origen_id: String(form.get('origen_id')),
      destino_id: String(form.get('destino_id')),
      cantidad: Number(form.get('cantidad')),
      nota: String(form.get('nota') || ''),
    })) formElement.reset();
  }

  return (
    <div className="ops-grid">
      <form className="ops-form" onSubmit={submitStock}>
        <h3>Entrada o ajuste de stock</h3>
        <label>Movimiento
          <select value={movementType} onChange={(event) => setMovementType(event.target.value)}>
            <option value="ingreso">Ingreso por compra/reposición</option><option value="ajuste">Ajuste de inventario (+ o -)</option>
          </select>
        </label>
        <label>Producto<select name="producto_id" required defaultValue=""><option value="" disabled>Selecciona</option>{products.map((product) => <option value={product.id} key={product.id}>{product.nombre}</option>)}</select></label>
        <label>Ubicación<select name="ubicacion_id" required defaultValue=""><option value="" disabled>Selecciona</option>{locations.map((location) => <option value={location.id} key={location.id}>{location.nombre}</option>)}</select></label>
        <label>Cantidad{movementType === 'ajuste' ? ' (usa negativo para reducir)' : ''}
          <input name="cantidad" type="number" min={movementType === 'ingreso' ? '0.001' : undefined} step="0.001" required />
        </label>
        <label>Nota opcional<input name="nota" maxLength={500} placeholder="Factura o motivo del ajuste" /></label>
        <button className="button button-outline" type="submit">Registrar movimiento</button>
      </form>
      <form className="ops-form" onSubmit={submitTransfer}>
        <h3>Trasladar entre ubicaciones</h3>
        <label>Producto<select name="producto_id" required defaultValue=""><option value="" disabled>Selecciona</option>{products.map((product) => <option value={product.id} key={product.id}>{product.nombre}</option>)}</select></label>
        <label>Origen<select name="origen_id" required defaultValue=""><option value="" disabled>Selecciona</option>{locations.map((location) => <option value={location.id} key={location.id}>{location.nombre}</option>)}</select></label>
        <label>Destino<select name="destino_id" required defaultValue=""><option value="" disabled>Selecciona</option>{locations.map((location) => <option value={location.id} key={location.id}>{location.nombre}</option>)}</select></label>
        <label>Cantidad<input name="cantidad" type="number" min="0.001" step="0.001" required /></label>
        <button className="button button-outline" type="submit">Trasladar stock</button>
      </form>
    </div>
  );
}

function StayCard({ stay, products, locations, onAddCharge, onCheckout }: {
  stay: ActiveStay;
  products: OperationProduct[];
  locations: InventoryLocation[];
  onAddCharge: OperationsTabProps['onAddCharge'];
  onCheckout: OperationsTabProps['onCheckout'];
}) {
  const [locationId, setLocationId] = useState('');
  const [productId, setProductId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const stayLocations = locations.filter((location) => (
    location.tipo === 'tienda'
      || (location.tipo === 'minibar' && location.habitacion_id === stay.habitacion_id)
  ));
  const productsAtLocation = products.filter((product) => product.existencias.some((stock) => (
    stock.ubicacion_id === locationId && Number(stock.cantidad) > 0
  )));
  const chargesTotal = stay.cargos.reduce((total, charge) => total + Number(charge.total), 0);

  async function submitCharge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (await onAddCharge(stay.id, {
      producto_id: String(form.get('producto_id')),
      ubicacion_id: locationId,
      cantidad: Number(form.get('cantidad')),
    })) {
      formElement.reset();
      setProductId('');
    }
  }

  return (
    <article className="ops-card stay-card">
      <div className="ops-card-heading">
        <div><p className="eyebrow">HABITACIÓN {stay.habitacion}</p><h3>{stay.nombres} {stay.apellidos}</h3></div>
        <span className="status-pill available">Estadía activa</span>
      </div>
      <p className="ops-secondary">Ingreso {dateTime(stay.entrada_at)} · Tarifa {money(stay.tarifa_noche)} por noche</p>
      {stay.numero_documento && <p className="ops-secondary">{stay.tipo_documento}: {stay.numero_documento}{stay.telefono ? ` · ${stay.telefono}` : ''}</p>}
      <div className="ops-charge-list">
        {stay.cargos.length ? stay.cargos.map((charge) => (
          <div className="ops-charge-row" key={charge.id}>
            <span>{charge.descripcion} × {Number(charge.cantidad)}</span><b>{money(charge.total)}</b>
          </div>
        )) : <p className="ops-secondary">Sin consumos cargados.</p>}
      </div>
      <div className="ops-total-row"><span>Consumos pendientes</span><strong>{money(chargesTotal)}</strong></div>
      <form className="ops-charge-form" onSubmit={submitCharge}>
        <h4>Agregar consumo o compra a la cuenta</h4>
        <div className="ops-form-row">
          <label>Ubicación<select required value={locationId} onChange={(event) => {
            setLocationId(event.target.value);
            setProductId('');
          }}>
            <option value="">Selecciona</option>{stayLocations.map((item) => <option value={item.id} key={item.id}>{item.nombre}</option>)}
          </select></label>
          <label>Producto<select name="producto_id" required value={productId} onChange={(event) => setProductId(event.target.value)} disabled={!locationId || !productsAtLocation.length}>
            <option value="" disabled>Selecciona</option>{productsAtLocation.map((product) => <option value={product.id} key={product.id}>{product.nombre} · {money(product.precio_venta)}</option>)}
          </select></label>
          <label>Cantidad<input name="cantidad" type="number" min="0.001" step="0.001" defaultValue="1" required /></label>
        </div>
        {locationId && !productsAtLocation.length && (
          <p className="ops-secondary" role="status">
            No hay productos con existencias en esta ubicación. Registra un ingreso o traslada stock al minibar desde la sección Inventario; crear el producto en el catálogo no agrega existencias.
          </p>
        )}
        {!stayLocations.some((location) => location.tipo === 'minibar') && (
          <p className="ops-secondary" role="status">
            Esta habitación no tiene un minibar configurado. Puedes crearlo desde Inventario, asociándolo a esta habitación.
          </p>
        )}
        <button className="button button-outline" type="submit" disabled={!locationId || !productId || !productsAtLocation.length}>Cargar a habitación</button>
      </form>
      <div className="ops-checkout">
        <label>Pago al cierre<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
          <option value="efectivo">Efectivo</option><option value="tarjeta">Tarjeta</option><option value="transferencia">Transferencia</option>
        </select></label>
        <button className="button button-primary" onClick={() => onCheckout(stay.id, paymentMethod)}>Cerrar estadía y cobrar</button>
      </div>
    </article>
  );
}

function StoreSaleForm({ products, locations, onCreate }: {
  products: OperationProduct[];
  locations: InventoryLocation[];
  onCreate: OperationsTabProps['onCreateSale'];
}) {
  const [locationId, setLocationId] = useState('');
  const [lines, setLines] = useState([{ productId: '', quantity: '1' }]);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const storeLocations = locations.filter((location) => location.tipo === 'tienda');

  const availableProducts = useMemo(() => products.filter((product) => (
    product.existencias.some((stock) => stock.ubicacion_id === locationId && Number(stock.cantidad) > 0)
  )), [products, locationId]);
  const total = lines.reduce((sum, line) => {
    const product = products.find((item) => item.id === line.productId);
    return sum + (product ? Number(product.precio_venta) * Number(line.quantity || 0) : 0);
  }, 0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await onCreate({
      ubicacion_id: locationId,
      medio_pago: paymentMethod,
      items: lines.map((line) => ({
        producto_id: line.productId,
        cantidad: Number(line.quantity),
      })),
    })) setLines([{ productId: '', quantity: '1' }]);
  }

  return (
    <form className="ops-form ops-sale-form" onSubmit={submit}>
      <h3>Registrar venta directa</h3>
      <p className="ops-secondary">Solo se descuentan productos existentes en la tienda seleccionada.</p>
      <label>Tienda<select required value={locationId} onChange={(event) => setLocationId(event.target.value)}>
        <option value="">Selecciona</option>{storeLocations.map((location) => <option value={location.id} key={location.id}>{location.nombre}</option>)}
      </select></label>
      <div className="ops-sale-lines">
        {lines.map((line, index) => (
          <div className="ops-sale-line" key={index}>
            <label>Producto<select required value={line.productId} onChange={(event) => {
              const next = [...lines];
              next[index] = { ...line, productId: event.target.value };
              setLines(next);
            }} disabled={!locationId}>
              <option value="">Selecciona</option>{availableProducts.map((product) => <option value={product.id} key={product.id}>{product.nombre} · {money(product.precio_venta)}</option>)}
            </select></label>
            <label>Cantidad<input type="number" min="0.001" step="0.001" required value={line.quantity} onChange={(event) => {
              const next = [...lines];
              next[index] = { ...line, quantity: event.target.value };
              setLines(next);
            }} /></label>
            {lines.length > 1 && <button type="button" className="button button-outline" onClick={() => setLines(lines.filter((_, itemIndex) => itemIndex !== index))}>Quitar</button>}
          </div>
        ))}
      </div>
      <button type="button" className="text-button" onClick={() => setLines([...lines, { productId: '', quantity: '1' }])} disabled={!locationId}>Agregar otro producto</button>
      <label>Medio de pago<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
        <option value="efectivo">Efectivo</option><option value="tarjeta">Tarjeta</option><option value="transferencia">Transferencia</option>
      </select></label>
      <div className="ops-total-row"><span>Total a cobrar</span><strong>{money(total)}</strong></div>
      <button className="button button-primary" type="submit" disabled={!locationId || !lines.every((line) => line.productId && Number(line.quantity) > 0)}>Registrar y cobrar venta</button>
    </form>
  );
}

export function OperationsTab(props: OperationsTabProps) {
  const [section, setSection] = useState<OperationsSection>('inventory');
  const [from, setFrom] = useState(() => {
    const now = new Date();
    return localDate(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [to, setTo] = useState(() => localDate(new Date()));

  async function submitCheckIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (await props.onCheckIn({
      habitacion_id: String(form.get('habitacion_id')),
      nombres: String(form.get('nombres')),
      apellidos: String(form.get('apellidos')),
      tipo_documento: String(form.get('tipo_documento') || ''),
      numero_documento: String(form.get('numero_documento') || ''),
      telefono: String(form.get('telefono') || ''),
      correo: String(form.get('correo') || ''),
    })) formElement.reset();
  }

  return (
    <>
      <div className="admin-heading">
        <div><p className="eyebrow">OPERACIÓN DEL HOTEL</p><h1>Inventario e ingresos</h1><p>Controla existencias, estadías, ventas y cobros desde un solo lugar.</p></div>
      </div>
      <div className="ops-section-tabs" role="tablist" aria-label="Operaciones del hotel">
        {(Object.keys(sectionLabels) as OperationsSection[]).map((id) => (
          <button type="button" role="tab" aria-selected={section === id} className={section === id ? 'selected' : ''} key={id} onClick={() => setSection(id)}>{sectionLabels[id]}</button>
        ))}
      </div>

      {section === 'inventory' && (
        <div className="ops-section">
          <section className="admin-panel">
            <div className="panel-heading"><div><h2>Productos</h2><p>El stock se lleva por ubicación y queda respaldado por movimientos.</p></div></div>
            <div className="ops-grid">
              <ProductForm onCreate={props.onCreateProduct} />
              <LocationForm rooms={props.rooms} onCreate={props.onCreateLocation} />
            </div>
            <div className="ops-product-grid">
              {props.products.map((product) => {
                const totalStock = product.existencias.reduce((sum, stock) => sum + Number(stock.cantidad), 0);
                return (
                  <article className="ops-card" key={`${product.id}-${product.updated_at || ''}`}>
                    {totalStock <= Number(product.stock_minimo) && Number(product.stock_minimo) > 0
                      && <p className="ops-low-stock" role="status">Stock bajo: {totalStock} {product.unidad}; mínimo {Number(product.stock_minimo)}.</p>}
                    <div className="ops-card-heading"><div><span className="status-pill available">{product.categoria}</span><h3>{product.nombre}</h3></div><b>{money(product.precio_venta)}</b></div>
                    <p className="ops-secondary">Costo: {money(product.costo)} · por {product.unidad}</p>
                    {product.existencias.length > 0 ? product.existencias.map((stock) => (
                      <div className="ops-stock-row" key={stock.ubicacion_id}><span>{stock.ubicacion}</span><b>{Number(stock.cantidad)} {product.unidad}</b></div>
                    )) : <p className="ops-secondary">Sin stock registrado.</p>}
                    <ProductEditForm product={product} onUpdate={props.onUpdateProduct} />
                  </article>
                );
              })}
              {props.products.length === 0 && <p className="ops-empty">Aún no hay productos. Crea uno para empezar.</p>}
            </div>
          </section>
          <section className="admin-panel">
            <div className="panel-heading"><div><h2>Existencias y ubicaciones</h2><p>Registra compras, ajustes y reposiciones del minibar.</p></div></div>
            {props.locations.length === 0
              ? <p className="ops-empty">Crea primero una bodega, tienda o ubicación de minibar para administrar el stock.</p>
              : <StockForms products={props.products} locations={props.locations} onChange={props.onChangeStock} onTransfer={props.onTransferStock} />}
          </section>
          <section className="admin-panel">
            <div className="panel-heading"><div><h2>Movimientos recientes</h2><p>Últimos 100 movimientos de inventario.</p></div></div>
            <div className="ops-list">
              {props.movements.map((movement) => (
                <div className="ops-list-row" key={movement.id}>
                  <div><b>{movement.producto} · {movement.tipo}</b><small>{movement.origen || 'Ingreso'} → {movement.destino || 'Consumo/venta'} · {dateTime(movement.created_at)}{movement.usuario ? ` · ${movement.usuario}` : ''}</small></div>
                  <strong>{Number(movement.cantidad)}</strong>
                </div>
              ))}
              {props.movements.length === 0 && <p className="ops-empty">Los ingresos, ajustes y consumos aparecerán aquí.</p>}
            </div>
          </section>
        </div>
      )}

      {section === 'stays' && (
        <div className="ops-section">
          <section className="admin-panel">
            <div className="panel-heading"><div><h2>Check-in presencial</h2><p>Inicia una estadía solo en habitaciones disponibles con tarifa por noche.</p></div></div>
            <form className="ops-form ops-checkin-form" onSubmit={submitCheckIn}>
              <label>Habitación disponible<select name="habitacion_id" required defaultValue="">
                <option value="" disabled>Selecciona</option>{props.rooms.filter((room) => room.status === 'disponible').map((room) => <option value={room.id} key={room.id}>{room.number} · {room.type}</option>)}
              </select></label>
              <div className="ops-form-row"><label>Nombres<input name="nombres" required maxLength={120} /></label><label>Apellidos<input name="apellidos" required maxLength={120} /></label></div>
              <div className="ops-form-row"><label>Tipo de documento<input name="tipo_documento" maxLength={40} /></label><label>Número de documento<input name="numero_documento" maxLength={80} /></label></div>
              <div className="ops-form-row"><label>Teléfono<input name="telefono" maxLength={40} /></label><label>Correo<input name="correo" type="email" maxLength={254} /></label></div>
              <button className="button button-primary" type="submit" disabled={!props.rooms.some((room) => room.status === 'disponible')}>Registrar check-in</button>
            </form>
          </section>
          <section className="admin-panel">
            <div className="panel-heading"><div><h2>Estadías activas</h2><p>Los consumos se cargan a la cuenta y se cobran al cerrar.</p></div><span className="status-pill available">{props.stays.length} activas</span></div>
            <div className="ops-stay-grid">
              {props.stays.map((stay) => <StayCard key={stay.id} stay={stay} products={props.products} locations={props.locations} onAddCharge={props.onAddCharge} onCheckout={props.onCheckout} />)}
              {props.stays.length === 0 && <p className="ops-empty">No hay estadías activas.</p>}
            </div>
          </section>
        </div>
      )}

      {section === 'sales' && (
        <section className="admin-panel ops-section">
          <div className="panel-heading"><div><h2>Venta directa de tienda</h2><p>Registra el pago y descuenta las existencias en la misma operación.</p></div></div>
          {props.locations.some((location) => location.tipo === 'tienda')
            ? <StoreSaleForm products={props.products} locations={props.locations} onCreate={props.onCreateSale} />
            : <p className="ops-empty">Crea una ubicación de tipo tienda antes de registrar ventas.</p>}
        </section>
      )}

      {section === 'income' && (
        <section className="admin-panel ops-section">
          <div className="panel-heading"><div><h2>Ingresos cobrados</h2><p>Separa alojamiento, consumos de habitación y ventas directas.</p></div></div>
          <form className="ops-range-form" onSubmit={(event) => { event.preventDefault(); void props.onLoadRevenue(from, to); }}>
            <label>Desde<input type="date" required value={from} onChange={(event) => setFrom(event.target.value)} /></label>
            <label>Hasta<input type="date" required min={from} value={to} onChange={(event) => setTo(event.target.value)} /></label>
            <button type="submit" className="button button-outline">Consultar</button>
          </form>
          {props.revenue ? (
            <div className="ops-revenue-grid">
              <article className="ops-revenue-card"><span>Alojamiento</span><strong>{money(props.revenue.alojamiento.total)}</strong><small>{props.revenue.alojamiento.operaciones} cargos cobrados</small></article>
              <article className="ops-revenue-card"><span>Minibar</span><strong>{money(props.revenue.minibar.total)}</strong><small>{props.revenue.minibar.operaciones} consumos</small></article>
              <article className="ops-revenue-card"><span>Tienda</span><strong>{money(props.revenue.tienda.total)}</strong><small>{props.revenue.tienda.operaciones} ventas/cargos</small></article>
              <article className="ops-revenue-card total"><span>Total cobrado</span><strong>{money(props.revenue.total)}</strong><small>{props.revenue.desde} — {props.revenue.hasta}</small></article>
            </div>
          ) : <p className="ops-empty">Selecciona un rango y consulta los ingresos.</p>}
        </section>
      )}

      {section === 'cash' && (
        <section className="admin-panel ops-section">
          <div className="panel-heading"><div><h2>Cierre de caja personal</h2><p>Conciliación de los pagos que registraste desde el cierre anterior.</p></div></div>
          {props.cashSummary ? (
            <>
              <p className="ops-secondary">Periodo actual: {new Date(props.cashSummary.desde_at).getFullYear() === 1970 ? 'desde el primer cobro' : dateTime(props.cashSummary.desde_at)} — {dateTime(props.cashSummary.hasta_at)} · {props.cashSummary.operaciones} pagos recibidos</p>
              <div className="ops-revenue-grid">
                <article className="ops-revenue-card"><span>Efectivo esperado</span><strong>{money(props.cashSummary.efectivo)}</strong></article>
                <article className="ops-revenue-card"><span>Tarjeta</span><strong>{money(props.cashSummary.tarjeta)}</strong></article>
                <article className="ops-revenue-card"><span>Transferencias</span><strong>{money(props.cashSummary.transferencia)}</strong></article>
              </div>
              {props.canCloseCash ? (
                <form className="ops-form ops-cash-form" onSubmit={async (event) => {
                  event.preventDefault();
                  const formElement = event.currentTarget;
                  const form = new FormData(formElement);
                  const closing = await props.onCloseCash(
                    Number(form.get('efectivo_declarado')),
                    String(form.get('nota') || ''),
                  );
                  if (closing) formElement.reset();
                }}>
                  <h3>Contar y cerrar</h3>
                  <label>Efectivo contado<input name="efectivo_declarado" type="number" min="0" step="0.01" required /></label>
                  <label>Nota opcional<input name="nota" maxLength={500} placeholder="Observaciones del turno" /></label>
                  <p className="ops-secondary">La diferencia se calcula como efectivo contado menos efectivo esperado. El cierre deja el siguiente periodo listo.</p>
                  <button className="button button-primary" type="submit" disabled={props.cashSummary.operaciones === 0}>Registrar cierre de caja</button>
                </form>
              ) : <p className="ops-empty">Tienes acceso de consulta; un usuario con permisos de caja puede registrar el cierre.</p>}
            </>
          ) : <p className="ops-empty">No se pudo cargar el resumen de caja.</p>}
        </section>
      )}
    </>
  );
}
