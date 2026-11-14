const {
  optionalText,
  requireBoolean,
  requireEmail,
  requireObject,
  requireText,
  requireUuid,
} = require('../../lib/validation');
const { HttpError } = require('../../lib/httpError');

const EDITABLE_FIELDS = new Set([
  'nombre_comercial',
  'tipo_establecimiento',
  'municipio_id',
  'division_territorial_id',
  'direccion',
  'latitud',
  'longitud',
  'telefono',
  'whatsapp',
  'correo',
  'logo_url',
  'descripcion',
  'visible_publicamente',
]);
const ESTABLISHMENT_TYPES = new Set(['hotel', 'residencia', 'motel']);

function validateEstablishmentUpdate(body) {
  requireObject(body);
  const keys = Object.keys(body);
  if (keys.length === 0 || keys.some((key) => !EDITABLE_FIELDS.has(key))) {
    throw new HttpError(400, 'Incluye al menos un campo editable y ningún campo adicional.');
  }

  const values = {};
  if (Object.hasOwn(body, 'nombre_comercial')) {
    values.nombre_comercial = requireText(body.nombre_comercial, 'El nombre comercial', { max: 180 });
  }
  if (Object.hasOwn(body, 'tipo_establecimiento')) {
    const type = requireText(body.tipo_establecimiento, 'El tipo de establecimiento', { max: 30 })
      .toLowerCase();
    if (!ESTABLISHMENT_TYPES.has(type)) {
      throw new HttpError(400, 'El tipo debe ser hotel, residencia o motel.');
    }
    values.tipo_establecimiento = type;
  }
  for (const field of ['municipio_id', 'division_territorial_id']) {
    if (Object.hasOwn(body, field)) {
      values[field] = body[field] === null
        ? null
        : requireUuid(body[field], field === 'municipio_id' ? 'El municipio' : 'La división territorial');
    }
  }
  for (const field of ['direccion', 'telefono', 'whatsapp', 'logo_url', 'descripcion']) {
    if (Object.hasOwn(body, field)) {
      const max = field === 'descripcion' ? 5000 : field === 'logo_url' ? 1000 : 300;
      values[field] = optionalText(body[field], field, max);
    }
  }
  if (Object.hasOwn(body, 'correo')) {
    values.correo = body.correo === null || body.correo === ''
      ? null
      : requireEmail(body.correo);
  }
  for (const field of ['latitud', 'longitud']) {
    if (Object.hasOwn(body, field)) {
      if (body[field] === null || body[field] === '') {
        values[field] = null;
      } else {
        const number = Number(body[field]);
        const limit = field === 'latitud' ? 90 : 180;
        if (!Number.isFinite(number) || Math.abs(number) > limit) {
          throw new HttpError(400, `${field} está fuera de rango.`);
        }
        values[field] = number;
      }
    }
  }
  if (Object.hasOwn(body, 'visible_publicamente')) {
    values.visible_publicamente = requireBoolean(
      body.visible_publicamente,
      'visible_publicamente',
    );
  }

  if (values.division_territorial_id && values.municipio_id === null) {
    throw new HttpError(400, 'Selecciona un municipio para asignar una división territorial.');
  }
  if (values.municipio_id === null && !Object.hasOwn(values, 'division_territorial_id')) {
    values.division_territorial_id = null;
  }

  return values;
}

module.exports = { validateEstablishmentUpdate };
