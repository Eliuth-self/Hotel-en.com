const {
  optionalText,
  requireEmail,
  requireObject,
  requirePassword,
  requireText,
  requireUuid,
} = require('../../lib/validation');
const { HttpError } = require('../../lib/httpError');

const ESTABLISHMENT_TYPES = new Set(['hotel', 'residencia', 'motel']);

function validateOnboarding(body) {
  requireObject(body);
  requireObject(body.empresa, 'La empresa');
  requireObject(body.establecimiento, 'El establecimiento');
  requireObject(body.administrador, 'El administrador');

  const company = {
    razon_social: requireText(body.empresa.razon_social, 'La razón social', { max: 180 }),
    tipo_documento: requireText(body.empresa.tipo_documento, 'El tipo de documento', { max: 40 }),
    numero_documento: requireText(body.empresa.numero_documento, 'El número de documento', { max: 60 }),
    correo_contacto: requireEmail(body.empresa.correo_contacto),
    telefono: optionalText(body.empresa.telefono, 'El teléfono', 40),
  };

  const type = requireText(
    body.establecimiento.tipo_establecimiento,
    'El tipo de establecimiento',
    { max: 30 },
  ).toLowerCase();
  if (!ESTABLISHMENT_TYPES.has(type)) {
    throw new HttpError(400, 'El tipo debe ser hotel, residencia o motel.');
  }

  const municipalityId = body.establecimiento.municipio_id
    ? requireUuid(body.establecimiento.municipio_id, 'El municipio')
    : null;
  const divisionId = body.establecimiento.division_territorial_id
    ? requireUuid(body.establecimiento.division_territorial_id, 'La división territorial')
    : null;
  if (divisionId && !municipalityId) {
    throw new HttpError(400, 'Selecciona un municipio para asignar una división territorial.');
  }

  const establishment = {
    nombre_comercial: requireText(
      body.establecimiento.nombre_comercial,
      'El nombre comercial',
      { max: 180 },
    ),
    tipo_establecimiento: type,
    municipio_id: municipalityId,
    division_territorial_id: divisionId,
    direccion: optionalText(body.establecimiento.direccion, 'La dirección'),
    telefono: optionalText(body.establecimiento.telefono, 'El teléfono', 40),
    whatsapp: optionalText(body.establecimiento.whatsapp, 'El WhatsApp', 40),
    correo: body.establecimiento.correo
      ? requireEmail(body.establecimiento.correo)
      : null,
    logo_url: optionalText(body.establecimiento.logo_url, 'La URL del logo', 1000),
    descripcion: optionalText(body.establecimiento.descripcion, 'La descripción', 5000),
  };

  const administrator = {
    nombres: requireText(body.administrador.nombres, 'Los nombres', { max: 120 }),
    apellidos: requireText(body.administrador.apellidos, 'Los apellidos', { max: 120 }),
    correo: requireEmail(body.administrador.correo),
    password: requirePassword(body.administrador.password),
    telefono: optionalText(body.administrador.telefono, 'El teléfono', 40),
  };

  return { company, establishment, administrator };
}

module.exports = { validateOnboarding };
