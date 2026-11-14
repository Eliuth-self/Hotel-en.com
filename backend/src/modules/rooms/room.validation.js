const { HttpError } = require('../../lib/httpError');
const {
  optionalText,
  requireBoolean,
  requireObject,
  requireText,
} = require('../../lib/validation');

const ROOM_STATES = new Set([
  'disponible',
  'ocupada',
  'mantenimiento',
  'limpieza',
  'inactiva',
]);
const CREATE_FIELDS = new Set([
  'numero',
  'ubicacion',
  'estado',
  'minibar',
  'resena',
  'contenido',
  'tarifas',
]);
const UPDATE_FIELDS = CREATE_FIELDS;

function validateRoomState(value) {
  const state = requireText(value, 'El estado', { max: 20 }).toLowerCase();
  if (!ROOM_STATES.has(state)) {
    throw new HttpError(
      400,
      'El estado debe ser disponible, ocupada, mantenimiento, limpieza o inactiva.',
    );
  }
  return state;
}

function validateContents(value) {
  if (!Array.isArray(value) || value.length > 100) {
    throw new HttpError(400, 'El contenido debe ser una lista de hasta 100 elementos.');
  }
  return value.map((item, index) => (
    requireText(item, `El elemento ${index + 1} del contenido`, { max: 120 })
  ));
}

function validateRates(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 30) {
    throw new HttpError(400, 'Registra entre 1 y 30 tarifas para la habitación.');
  }

  const unique = new Set();
  return value.map((rate, index) => {
    requireObject(rate, `La tarifa ${index + 1}`);
    const allowedRateFields = new Set([
      'modalidad',
      'duracion_minutos',
      'precio',
      'moneda',
    ]);
    if (Object.keys(rate).some((field) => !allowedRateFields.has(field))) {
      throw new HttpError(400, `La tarifa ${index + 1} contiene campos no permitidos.`);
    }

    const modalidad = requireText(rate.modalidad, 'La modalidad de la tarifa', { max: 100 });
    const duration = rate.duracion_minutos;
    if (duration !== undefined && duration !== null
      && (!Number.isSafeInteger(duration) || duration <= 0)) {
      throw new HttpError(400, 'La duración debe ser un número entero de minutos mayor que cero.');
    }

    if (typeof rate.precio !== 'number'
      || !Number.isFinite(rate.precio)
      || rate.precio <= 0
      || rate.precio > 9999999999.99) {
      throw new HttpError(400, 'El precio de cada tarifa debe ser un número mayor que cero.');
    }

    const moneda = rate.moneda === undefined
      ? 'COP'
      : requireText(rate.moneda, 'La moneda', { min: 3, max: 3 }).toUpperCase();
    if (!/^[A-Z]{3}$/.test(moneda)) {
      throw new HttpError(400, 'La moneda debe ser un código de tres letras, como COP.');
    }

    const key = `${modalidad.toLowerCase()}|${duration || ''}`;
    if (unique.has(key)) {
      throw new HttpError(400, 'No repitas la modalidad y duración de una tarifa.');
    }
    unique.add(key);

    return {
      modalidad,
      duracion_minutos: duration || null,
      precio: rate.precio,
      moneda,
    };
  });
}

function validateFields(body, allowedFields, isCreate) {
  requireObject(body);
  const fields = Object.keys(body);
  if ((isCreate && fields.some((field) => !allowedFields.has(field)))
    || (!isCreate && (fields.length === 0 || fields.some((field) => !allowedFields.has(field))))) {
    throw new HttpError(400, 'Incluye campos válidos y ningún campo adicional.');
  }

  const values = {};
  if (Object.hasOwn(body, 'numero')) {
    values.numero = requireText(body.numero, 'El número o código de habitación', { max: 40 });
  } else if (isCreate) {
    values.numero = requireText(undefined, 'El número o código de habitación', { max: 40 });
  }

  if (Object.hasOwn(body, 'ubicacion')) {
    values.ubicacion = requireText(body.ubicacion, 'La ubicación', { max: 180 });
  } else if (isCreate) {
    values.ubicacion = requireText(undefined, 'La ubicación', { max: 180 });
  }

  if (Object.hasOwn(body, 'estado')) {
    values.estado = validateRoomState(body.estado);
  }
  if (Object.hasOwn(body, 'minibar')) {
    values.minibar = requireBoolean(body.minibar, 'minibar');
  }
  if (Object.hasOwn(body, 'resena')) {
    values.resena = optionalText(body.resena, 'La reseña', 5000);
  }
  if (Object.hasOwn(body, 'contenido')) {
    values.contenido = validateContents(body.contenido);
  }
  if (Object.hasOwn(body, 'tarifas')) {
    values.tarifas = validateRates(body.tarifas);
  } else if (isCreate) {
    throw new HttpError(400, 'Registra al menos una tarifa para la habitación.');
  }

  if (isCreate) {
    values.estado = values.estado || 'disponible';
    values.minibar = values.minibar === undefined ? false : values.minibar;
    values.resena = values.resena === undefined ? null : values.resena;
    values.contenido = values.contenido || [];
  }
  return values;
}

function validateCreateRoom(body) {
  return validateFields(body, CREATE_FIELDS, true);
}

function validateUpdateRoom(body) {
  return validateFields(body, UPDATE_FIELDS, false);
}

const GROUP_FIELDS = new Set([
  'nombre',
  'ubicacion',
  'minibar',
  'resena',
  'contenido',
  'tarifas',
]);

function validateRoomGroup(body, isCreate = true) {
  requireObject(body);
  const fields = Object.keys(body);
  if ((isCreate && fields.some((field) => !GROUP_FIELDS.has(field)))
    || (!isCreate
      && (fields.length === 0 || fields.some((field) => !GROUP_FIELDS.has(field))))) {
    throw new HttpError(400, 'Incluye campos válidos y ningún campo adicional.');
  }

  const values = {};
  if (Object.hasOwn(body, 'nombre')) {
    values.nombre = requireText(body.nombre, 'El nombre del grupo', { max: 180 });
  } else if (isCreate) {
    values.nombre = requireText(undefined, 'El nombre del grupo', { max: 180 });
  }
  if (Object.hasOwn(body, 'ubicacion')) {
    values.ubicacion = requireText(body.ubicacion, 'La ubicación', { max: 180 });
  } else if (isCreate) {
    values.ubicacion = requireText(undefined, 'La ubicación', { max: 180 });
  }
  if (Object.hasOwn(body, 'minibar')) {
    values.minibar = requireBoolean(body.minibar, 'minibar');
  } else if (isCreate) {
    values.minibar = false;
  }
  if (Object.hasOwn(body, 'resena')) {
    values.resena = optionalText(body.resena, 'La reseña', 5000);
  } else if (isCreate) {
    values.resena = null;
  }
  if (Object.hasOwn(body, 'contenido')) {
    values.contenido = validateContents(body.contenido);
  } else if (isCreate) {
    values.contenido = [];
  }
  if (Object.hasOwn(body, 'tarifas')) {
    values.tarifas = validateRates(body.tarifas);
  } else if (isCreate) {
    throw new HttpError(400, 'Registra al menos una tarifa para el grupo.');
  }

  return values;
}

function validateBulkRoomNumbers(body) {
  requireObject(body);
  if (Object.keys(body).some((field) => field !== 'numeros')) {
    throw new HttpError(400, 'Incluye únicamente la lista de números de habitación.');
  }
  if (!Array.isArray(body.numeros) || body.numeros.length === 0 || body.numeros.length > 500) {
    throw new HttpError(400, 'Indica entre 1 y 500 números de habitación.');
  }
  const numbers = body.numeros.map((number, index) => (
    requireText(number, `El número de habitación ${index + 1}`, { max: 40 })
  ));
  if (new Set(numbers).size !== numbers.length) {
    throw new HttpError(400, 'No repitas números de habitación en el mismo lote.');
  }
  return numbers;
}

module.exports = {
  validateBulkRoomNumbers,
  validateCreateRoom,
  validateRoomGroup,
  validateUpdateRoom,
};
