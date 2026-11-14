const { HttpError } = require('../../lib/httpError');
const {
  optionalText,
  requireEmail,
  requireObject,
  requireText,
  requireUuid,
} = require('../../lib/validation');

const CATEGORIES = new Set(['minibar', 'tienda', 'general']);
const LOCATION_TYPES = new Set(['bodega', 'minibar', 'tienda']);
const PAYMENT_METHODS = new Set(['efectivo', 'tarjeta', 'transferencia']);

function requireFields(body, allowed, required = []) {
  requireObject(body);
  if (Object.keys(body).some((field) => !allowed.has(field))) {
    throw new HttpError(400, 'La solicitud contiene campos no permitidos.');
  }
  for (const field of required) {
    if (!Object.hasOwn(body, field)) {
      throw new HttpError(400, `El campo ${field} es obligatorio.`);
    }
  }
}

function requireAmount(value, field, { allowZero = false, allowNegative = false } = {}) {
  const validNumber = typeof value === 'number' && Number.isFinite(value);
  const validSign = allowNegative
    ? value !== 0
    : allowZero ? value >= 0 : value > 0;
  const validPrecision = validNumber && Math.abs(value * 100 - Math.round(value * 100)) < 0.000001;
  if (!validNumber || !validSign || !validPrecision || Math.abs(value) > 9999999999.99) {
    throw new HttpError(400, `${field} debe ser un número ${allowNegative ? 'distinto de cero' : allowZero ? 'igual o mayor que cero' : 'mayor que cero'}.`);
  }
  return value;
}

function requireQuantity(value, field, { allowNegative = false, allowZero = false } = {}) {
  const validNumber = typeof value === 'number' && Number.isFinite(value);
  const validSign = allowNegative ? value !== 0 : allowZero ? value >= 0 : value > 0;
  const validPrecision = validNumber && Math.abs(value * 1000 - Math.round(value * 1000)) < 0.000001;
  if (!validNumber || !validSign || !validPrecision || Math.abs(value) > 999999999.999) {
    throw new HttpError(400, `${field} debe tener hasta tres decimales y ser ${allowNegative ? 'distinta de cero' : allowZero ? 'igual o mayor que cero' : 'mayor que cero'}.`);
  }
  return value;
}

function validateProduct(body) {
  const allowed = new Set(['nombre', 'categoria', 'unidad', 'costo', 'precio_venta', 'stock_minimo']);
  requireFields(body, allowed, ['nombre', 'categoria', 'costo', 'precio_venta']);
  if (!CATEGORIES.has(body.categoria)) {
    throw new HttpError(400, 'La categoría debe ser minibar, tienda o general.');
  }
  return {
    nombre: requireText(body.nombre, 'El nombre del producto', { max: 180 }),
    categoria: body.categoria,
    unidad: body.unidad === undefined
      ? 'unidad'
      : requireText(body.unidad, 'La unidad', { max: 40 }),
    costo: requireAmount(body.costo, 'El costo', { allowZero: true }),
    precio_venta: requireAmount(body.precio_venta, 'El precio de venta'),
    stock_minimo: body.stock_minimo === undefined
      ? 0
      : requireQuantity(body.stock_minimo, 'El stock mínimo', { allowZero: true }),
  };
}

function validateLocation(body) {
  const allowed = new Set(['nombre', 'tipo', 'habitacion_id']);
  requireFields(body, allowed, ['nombre', 'tipo']);
  if (!LOCATION_TYPES.has(body.tipo)) {
    throw new HttpError(400, 'El tipo de ubicación debe ser bodega, minibar o tienda.');
  }
  if ((body.tipo === 'minibar') !== Boolean(body.habitacion_id)) {
    throw new HttpError(400, 'Cada minibar debe estar asociado a una habitación.');
  }
  return {
    nombre: requireText(body.nombre, 'El nombre de la ubicación', { max: 180 }),
    tipo: body.tipo,
    habitacion_id: body.habitacion_id
      ? requireUuid(body.habitacion_id, 'La habitación')
      : null,
  };
}

function validateStockChange(body) {
  const allowed = new Set(['producto_id', 'ubicacion_id', 'tipo', 'cantidad', 'nota']);
  requireFields(body, allowed, ['producto_id', 'ubicacion_id', 'tipo', 'cantidad']);
  if (!['ingreso', 'ajuste'].includes(body.tipo)) {
    throw new HttpError(400, 'El movimiento debe ser ingreso o ajuste.');
  }
  const quantity = body.tipo === 'ajuste'
    ? requireQuantity(body.cantidad, 'La cantidad del ajuste', { allowNegative: true })
    : requireQuantity(body.cantidad, 'La cantidad');
  return {
    producto_id: requireUuid(body.producto_id, 'El producto'),
    ubicacion_id: requireUuid(body.ubicacion_id, 'La ubicación'),
    tipo: body.tipo,
    cantidad: quantity,
    nota: optionalText(body.nota, 'La nota', 500),
  };
}

function validateTransfer(body) {
  const allowed = new Set(['producto_id', 'origen_id', 'destino_id', 'cantidad', 'nota']);
  requireFields(body, allowed, ['producto_id', 'origen_id', 'destino_id', 'cantidad']);
  const origen_id = requireUuid(body.origen_id, 'La ubicación de origen');
  const destino_id = requireUuid(body.destino_id, 'La ubicación de destino');
  if (origen_id === destino_id) {
    throw new HttpError(400, 'El origen y el destino deben ser distintos.');
  }
  return {
    producto_id: requireUuid(body.producto_id, 'El producto'),
    origen_id,
    destino_id,
    cantidad: requireQuantity(body.cantidad, 'La cantidad'),
    nota: optionalText(body.nota, 'La nota', 500),
  };
}

function validateCheckIn(body) {
  const allowed = new Set([
    'habitacion_id',
    'nombres',
    'apellidos',
    'tipo_documento',
    'numero_documento',
    'telefono',
    'correo',
  ]);
  requireFields(body, allowed, ['habitacion_id', 'nombres', 'apellidos']);
  const tipo_documento = optionalText(body.tipo_documento, 'El tipo de documento', 40);
  const numero_documento = optionalText(body.numero_documento, 'El número de documento', 80);
  if (Boolean(tipo_documento) !== Boolean(numero_documento)) {
    throw new HttpError(400, 'Indica tanto el tipo como el número de documento, o deja ambos vacíos.');
  }
  const correo = body.correo ? requireEmail(body.correo) : null;
  return {
    habitacion_id: requireUuid(body.habitacion_id, 'La habitación'),
    nombres: requireText(body.nombres, 'Los nombres', { max: 120 }),
    apellidos: requireText(body.apellidos, 'Los apellidos', { max: 120 }),
    tipo_documento,
    numero_documento,
    telefono: optionalText(body.telefono, 'El teléfono', 40),
    correo,
  };
}

function validateStayCharge(body) {
  const allowed = new Set(['producto_id', 'ubicacion_id', 'cantidad']);
  requireFields(body, allowed, ['producto_id', 'ubicacion_id', 'cantidad']);
  return {
    producto_id: requireUuid(body.producto_id, 'El producto'),
    ubicacion_id: requireUuid(body.ubicacion_id, 'La ubicación'),
    cantidad: requireQuantity(body.cantidad, 'La cantidad'),
  };
}

function validatePayment(body) {
  const allowed = new Set(['medio_pago']);
  requireFields(body, allowed, ['medio_pago']);
  if (!PAYMENT_METHODS.has(body.medio_pago)) {
    throw new HttpError(400, 'El medio de pago debe ser efectivo, tarjeta o transferencia.');
  }
  return { medio_pago: body.medio_pago };
}

function validateCashClose(body) {
  const allowed = new Set(['efectivo_declarado', 'nota']);
  requireFields(body, allowed, ['efectivo_declarado']);
  return {
    efectivo_declarado: requireAmount(
      body.efectivo_declarado,
      'El efectivo contado',
      { allowZero: true },
    ),
    nota: optionalText(body.nota, 'La nota', 500),
  };
}

function validateSale(body) {
  const allowed = new Set(['ubicacion_id', 'medio_pago', 'items']);
  requireFields(body, allowed, ['ubicacion_id', 'medio_pago', 'items']);
  if (!PAYMENT_METHODS.has(body.medio_pago)) {
    throw new HttpError(400, 'El medio de pago debe ser efectivo, tarjeta o transferencia.');
  }
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 100) {
    throw new HttpError(400, 'La venta debe incluir entre 1 y 100 productos.');
  }
  const seenProducts = new Set();
  const items = body.items.map((item, index) => {
    requireObject(item, `El producto ${index + 1}`);
    if (Object.keys(item).some((field) => !['producto_id', 'cantidad'].includes(field))) {
      throw new HttpError(400, `El producto ${index + 1} contiene campos no permitidos.`);
    }
    const producto_id = requireUuid(item.producto_id, `El producto ${index + 1}`);
    if (seenProducts.has(producto_id)) {
      throw new HttpError(400, 'No repitas un producto en la misma venta.');
    }
    seenProducts.add(producto_id);
    return {
      producto_id,
      cantidad: requireQuantity(item.cantidad, `La cantidad del producto ${index + 1}`),
    };
  });
  return {
    ubicacion_id: requireUuid(body.ubicacion_id, 'La ubicación'),
    medio_pago: body.medio_pago,
    items,
  };
}

module.exports = {
  validateCheckIn,
  validateCashClose,
  validateLocation,
  validatePayment,
  validateProduct,
  validateSale,
  validateStockChange,
  validateStayCharge,
  validateTransfer,
};
