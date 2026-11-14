const {
  optionalText,
  requireBoolean,
  requireEmail,
  requireObject,
  requirePassword,
  requireText,
} = require('../../lib/validation');
const { HttpError } = require('../../lib/httpError');

const ROLE_CODES = new Set([
  'administrador',
  'recepcionista',
  'cajero',
  'inventario',
  'limpieza',
  'supervisor',
]);
const CREATE_FIELDS = new Set([
  'nombres',
  'apellidos',
  'correo',
  'password',
  'telefono',
  'roles',
]);
const UPDATE_FIELDS = new Set([
  'nombres',
  'apellidos',
  'correo',
  'password',
  'telefono',
  'estado',
  'roles',
]);

function validateRoles(roles) {
  if (!Array.isArray(roles) || roles.length === 0) {
    throw new HttpError(400, 'Asigna al menos un rol.');
  }
  const uniqueRoles = [...new Set(roles)];
  if (uniqueRoles.some((role) => typeof role !== 'string' || !ROLE_CODES.has(role))) {
    throw new HttpError(400, 'Uno o más roles no son válidos.');
  }
  return uniqueRoles;
}

function validateCreateUser(body) {
  requireObject(body);
  if (Object.keys(body).some((key) => !CREATE_FIELDS.has(key))) {
    throw new HttpError(400, 'El cuerpo contiene campos que no se pueden modificar.');
  }

  return {
    nombres: requireText(body.nombres, 'Los nombres', { max: 120 }),
    apellidos: requireText(body.apellidos, 'Los apellidos', { max: 120 }),
    correo: requireEmail(body.correo),
    password: requirePassword(body.password),
    telefono: optionalText(body.telefono, 'El teléfono', 40),
    roles: validateRoles(body.roles),
  };
}

function validateUpdateUser(body) {
  requireObject(body);
  const keys = Object.keys(body);
  if (keys.length === 0 || keys.some((key) => !UPDATE_FIELDS.has(key))) {
    throw new HttpError(400, 'Incluye al menos un campo editable y ningún campo adicional.');
  }

  const values = {};
  if (Object.hasOwn(body, 'nombres')) {
    values.nombres = requireText(body.nombres, 'Los nombres', { max: 120 });
  }
  if (Object.hasOwn(body, 'apellidos')) {
    values.apellidos = requireText(body.apellidos, 'Los apellidos', { max: 120 });
  }
  if (Object.hasOwn(body, 'correo')) {
    values.correo = requireEmail(body.correo);
  }
  if (Object.hasOwn(body, 'password')) {
    values.password = requirePassword(body.password);
  }
  if (Object.hasOwn(body, 'telefono')) {
    values.telefono = optionalText(body.telefono, 'El teléfono', 40);
  }
  if (Object.hasOwn(body, 'estado')) {
    values.estado = requireBoolean(body.estado, 'estado');
  }
  if (Object.hasOwn(body, 'roles')) {
    values.roles = validateRoles(body.roles);
  }
  return values;
}

module.exports = { validateCreateUser, validateUpdateUser };
