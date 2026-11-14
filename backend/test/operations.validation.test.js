const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validateCheckIn,
  validateCashClose,
  validateLocation,
  validatePayment,
  validateProduct,
  validateSale,
  validateStockChange,
  validateStayCharge,
  validateTransfer,
} = require('../src/modules/operations/operations.validation');
const { getRevenue } = require('../src/modules/operations/operations.service');

const roomId = 'f9c2a198-34ee-4ddc-9a9b-0d78087ef322';
const productId = '95e7a89d-6a1e-4cb0-868f-53f47c6d6c6d';
const locationId = '3b3dc363-5667-4aa1-82fb-50efb0da3937';
const destinationId = '0b34123a-81db-4c0d-b70c-bb6dcbab9f90';

test('product validation normalizes optional unit and rejects negative prices', () => {
  assert.deepEqual(validateProduct({
    nombre: 'Agua',
    categoria: 'minibar',
    costo: 0,
    precio_venta: 5000,
    stock_minimo: 3,
  }), {
    nombre: 'Agua',
    categoria: 'minibar',
    unidad: 'unidad',
    costo: 0,
    precio_venta: 5000,
    stock_minimo: 3,
  });
  assert.throws(() => validateProduct({
    nombre: 'Agua',
    categoria: 'minibar',
    costo: -1,
    precio_venta: 5000,
  }), /costo debe ser/);
});

test('inventory location requires a room only for minibar locations', () => {
  assert.equal(validateLocation({
    nombre: 'Minibar 101',
    tipo: 'minibar',
    habitacion_id: roomId,
  }).habitacion_id, roomId);
  assert.throws(() => validateLocation({
    nombre: 'Minibar',
    tipo: 'minibar',
  }), /asociado a una habitación/);
  assert.throws(() => validateLocation({
    nombre: 'Tienda',
    tipo: 'tienda',
    habitacion_id: roomId,
  }), /asociado a una habitación/);
});

test('stock validation distinguishes positive entries from signed adjustments', () => {
  assert.equal(validateStockChange({
    producto_id: productId,
    ubicacion_id: locationId,
    tipo: 'ajuste',
    cantidad: -2,
  }).cantidad, -2);
  assert.throws(() => validateStockChange({
    producto_id: productId,
    ubicacion_id: locationId,
    tipo: 'ingreso',
    cantidad: -2,
  }), /cantidad debe tener hasta tres decimales y ser mayor que cero/);
  assert.throws(() => validateStockChange({
    producto_id: productId,
    ubicacion_id: locationId,
    tipo: 'ajuste',
    cantidad: 0,
  }), /cero/);
  assert.throws(() => validateStockChange({
    producto_id: productId,
    ubicacion_id: locationId,
    tipo: 'ingreso',
    cantidad: 0.0001,
  }), /hasta tres decimales/);
});

test('transfer requires distinct valid locations and a positive quantity', () => {
  assert.equal(validateTransfer({
    producto_id: productId,
    origen_id: locationId,
    destino_id: destinationId,
    cantidad: 3,
  }).cantidad, 3);
  assert.throws(() => validateTransfer({
    producto_id: productId,
    origen_id: locationId,
    destino_id: locationId,
    cantidad: 3,
  }), /deben ser distintos/);
});

test('check-in requires a guest and both document fields together', () => {
  assert.equal(validateCheckIn({
    habitacion_id: roomId,
    nombres: 'María',
    apellidos: 'Pérez',
  }).nombres, 'María');
  assert.throws(() => validateCheckIn({
    habitacion_id: roomId,
    nombres: 'María',
    apellidos: 'Pérez',
    numero_documento: '123',
  }), /tipo como el número de documento/);
});

test('stay charges and payments validate identifiers, quantities and payment methods', () => {
  assert.equal(validateStayCharge({
    producto_id: productId,
    ubicacion_id: locationId,
    cantidad: 1,
  }).cantidad, 1);
  assert.equal(validatePayment({ medio_pago: 'efectivo' }).medio_pago, 'efectivo');
  assert.throws(() => validatePayment({ medio_pago: 'cheque' }), /medio de pago debe ser/);
  assert.equal(validateCashClose({ efectivo_declarado: 0 }).efectivo_declarado, 0);
  assert.throws(() => validateCashClose({ efectivo_declarado: -1 }), /efectivo contado debe ser/);
});

test('direct sale rejects duplicate products and accepts valid line items', () => {
  assert.equal(validateSale({
    ubicacion_id: locationId,
    medio_pago: 'tarjeta',
    items: [{ producto_id: productId, cantidad: 2 }],
  }).items[0].cantidad, 2);
  assert.throws(() => validateSale({
    ubicacion_id: locationId,
    medio_pago: 'tarjeta',
    items: [
      { producto_id: productId, cantidad: 1 },
      { producto_id: productId, cantidad: 2 },
    ],
  }), /No repitas un producto/);
});

test('revenue reports reject impossible dates and reversed ranges', async () => {
  await assert.rejects(
    getRevenue('f9c2a198-34ee-4ddc-9a9b-0d78087ef322', '2026-02-31', '2026-03-01'),
    /rango de fechas válido/,
  );
  await assert.rejects(
    getRevenue('f9c2a198-34ee-4ddc-9a9b-0d78087ef322', '2026-03-02', '2026-03-01'),
    /rango de fechas válido/,
  );
});
