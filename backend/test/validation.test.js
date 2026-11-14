const test = require('node:test');
const assert = require('node:assert/strict');
const { validateOnboarding } = require('../src/modules/onboarding/onboarding.validation');
const {
  validateCreateUser,
  validateUpdateUser,
} = require('../src/modules/users/user.validation');
const {
  validateEstablishmentUpdate,
} = require('../src/modules/establishments/establishment.validation');
const {
  validateCompanyUpdate,
} = require('../src/modules/companies/company.validation');
const {
  validateBulkRoomNumbers,
  validateCreateRoom,
  validateRoomGroup,
  validateUpdateRoom,
} = require('../src/modules/rooms/room.validation');

const validOnboarding = {
  empresa: {
    razon_social: 'Hospedado Ejemplo SAS',
    tipo_documento: 'NIT',
    numero_documento: '900123456',
    correo_contacto: 'CONTACTO@example.com',
  },
  establecimiento: {
    nombre_comercial: 'Hotel Ejemplo',
    tipo_establecimiento: 'hotel',
  },
  administrador: {
    nombres: 'Ana',
    apellidos: 'Pérez',
    correo: 'ADMIN@example.com',
    password: 'una-clave-segura-123',
  },
};

test('onboarding normalizes email and permits optional geographic data', () => {
  const result = validateOnboarding(validOnboarding);
  assert.equal(result.company.correo_contacto, 'contacto@example.com');
  assert.equal(result.administrator.correo, 'admin@example.com');
  assert.equal(result.establishment.municipio_id, null);
});

test('onboarding requires a municipality when a territorial division is provided', () => {
  assert.throws(
    () => validateOnboarding({
      ...validOnboarding,
      establecimiento: {
        ...validOnboarding.establecimiento,
        division_territorial_id: 'f9c2a198-34ee-4ddc-9a9b-0d78087ef322',
      },
    }),
    /Selecciona un municipio/,
  );
});

test('onboarding rejects weak passwords and unsupported establishment types', () => {
  assert.throws(
    () => validateOnboarding({
      ...validOnboarding,
      administrador: { ...validOnboarding.administrador, password: 'corta' },
    }),
    /contraseña debe tener entre 10/,
  );
  assert.throws(
    () => validateOnboarding({
      ...validOnboarding,
      establecimiento: { ...validOnboarding.establecimiento, tipo_establecimiento: 'hostal' },
    }),
    /El tipo debe ser hotel, residencia o motel/,
  );
  assert.throws(
    () => validateOnboarding({
      ...validOnboarding,
      administrador: {
        ...validOnboarding.administrador,
        password: 'á'.repeat(40),
      },
    }),
    /72 bytes UTF-8/,
  );
});

test('user creation requires valid roles and rejects tenant reassignment fields', () => {
  const user = validateCreateUser({
    nombres: 'Luis',
    apellidos: 'Díaz',
    correo: 'luis@example.com',
    password: 'clave-segura-123',
    roles: ['recepcionista'],
  });
  assert.deepEqual(user.roles, ['recepcionista']);
  assert.throws(
    () => validateCreateUser({
      nombres: 'Luis',
      apellidos: 'Díaz',
      correo: 'luis@example.com',
      password: 'clave-segura-123',
      roles: ['administrador'],
      establecimiento_id: 'f9c2a198-34ee-4ddc-9a9b-0d78087ef322',
    }),
    /campos que no se pueden modificar/,
  );
});

test('user updates validate state and reject empty updates', () => {
  assert.deepEqual(validateUpdateUser({ estado: false }), { estado: false });
  assert.throws(() => validateUpdateUser({}), /Incluye al menos un campo editable/);
});

test('establishment updates reject fields outside the tenant-safe allowlist', () => {
  assert.throws(
    () => validateEstablishmentUpdate({
      visible_publicamente: true,
      empresa_id: 'f9c2a198-34ee-4ddc-9a9b-0d78087ef322',
    }),
    /ningún campo adicional/,
  );
});

test('company updates normalize email and reject changes to status', () => {
  assert.equal(
    validateCompanyUpdate({ correo_contacto: 'CONTACTO@example.com' }).correo_contacto,
    'contacto@example.com',
  );
  assert.throws(
    () => validateCompanyUpdate({ estado: 'inactiva' }),
    /ningún campo adicional/,
  );
});

test('room creation validates multi-duration rates and applies safe defaults', () => {
  const room = validateCreateRoom({
    numero: '101',
    ubicacion: 'Piso 1, ala norte',
    minibar: true,
    contenido: ['Cama doble', 'Televisor'],
    tarifas: [
      { modalidad: 'Por horas', duracion_minutos: 180, precio: 80000 },
      { modalidad: 'Noche', duracion_minutos: 720, precio: 180000 },
    ],
  });

  assert.equal(room.estado, 'disponible');
  assert.equal(room.minibar, true);
  assert.equal(room.tarifas[0].moneda, 'COP');
  assert.equal(room.resena, null);
});

test('room validation rejects duplicate rates and invalid state or price', () => {
  assert.throws(
    () => validateCreateRoom({
      numero: '101',
      ubicacion: 'Piso 1',
      tarifas: [
        { modalidad: 'Noche', precio: 100000 },
        { modalidad: 'noche', precio: 120000 },
      ],
    }),
    /No repitas la modalidad y duración/,
  );
  assert.throws(
    () => validateUpdateRoom({ estado: 'reservada' }),
    /El estado debe ser/,
  );
  assert.throws(
    () => validateUpdateRoom({ tarifas: [{ modalidad: 'Noche', precio: -1 }] }),
    /precio de cada tarifa/,
  );
});

test('room groups validate reusable room data and defaults', () => {
  const group = validateRoomGroup({
    nombre: 'Estándar',
    ubicacion: 'Piso 1',
    tarifas: [{ modalidad: 'Noche', precio: 180000 }],
  });
  assert.equal(group.minibar, false);
  assert.deepEqual(group.contenido, []);
  assert.equal(group.tarifas[0].moneda, 'COP');
  assert.throws(
    () => validateRoomGroup({
      nombre: 'Estándar',
      ubicacion: 'Piso 1',
      tarifas: [{ modalidad: 'Noche', precio: 180000 }],
      establecimiento_id: 'f9c2a198-34ee-4ddc-9a9b-0d78087ef322',
    }),
    /campos válidos y ningún campo adicional/,
  );
});

test('bulk room creation validates count and unique room numbers', () => {
  assert.deepEqual(validateBulkRoomNumbers({ numeros: ['101', '102'] }), ['101', '102']);
  assert.equal(validateBulkRoomNumbers({
    numeros: Array.from({ length: 500 }, (_, index) => String(index + 1)),
  }).length, 500);
  assert.throws(
    () => validateBulkRoomNumbers({ numeros: ['101', '101'] }),
    /No repitas números de habitación/,
  );
  assert.throws(
    () => validateBulkRoomNumbers({
      numeros: Array.from({ length: 501 }, (_, index) => String(index + 1)),
    }),
    /entre 1 y 500/,
  );
});
