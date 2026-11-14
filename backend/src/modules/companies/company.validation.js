const {
  optionalText,
  requireEmail,
  requireObject,
  requireText,
} = require('../../lib/validation');
const { HttpError } = require('../../lib/httpError');

const COMPANY_FIELDS = new Set([
  'razon_social',
  'tipo_documento',
  'numero_documento',
  'correo_contacto',
  'telefono',
]);

function validateCompanyUpdate(body) {
  requireObject(body);
  const keys = Object.keys(body);
  if (keys.length === 0 || keys.some((key) => !COMPANY_FIELDS.has(key))) {
    throw new HttpError(400, 'Incluye al menos un campo editable de empresa y ningún campo adicional.');
  }

  const values = {};
  if (Object.hasOwn(body, 'razon_social')) {
    values.razon_social = requireText(body.razon_social, 'La razón social', { max: 180 });
  }
  if (Object.hasOwn(body, 'tipo_documento')) {
    values.tipo_documento = requireText(body.tipo_documento, 'El tipo de documento', { max: 40 });
  }
  if (Object.hasOwn(body, 'numero_documento')) {
    values.numero_documento = requireText(body.numero_documento, 'El número de documento', { max: 60 });
  }
  if (Object.hasOwn(body, 'correo_contacto')) {
    values.correo_contacto = requireEmail(body.correo_contacto);
  }
  if (Object.hasOwn(body, 'telefono')) {
    values.telefono = optionalText(body.telefono, 'El teléfono', 40);
  }

  return values;
}

module.exports = { validateCompanyUpdate };
