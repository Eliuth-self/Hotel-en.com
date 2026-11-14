const { HttpError } = require('./httpError');

function requireObject(value, label = 'El cuerpo de la solicitud') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, `${label} debe ser un objeto.`);
  }
}

function requireText(value, field, { max = 180, min = 1 } = {}) {
  if (typeof value !== 'string') {
    throw new HttpError(400, `${field} es obligatorio.`);
  }

  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    throw new HttpError(400, `${field} debe tener entre ${min} y ${max} caracteres.`);
  }

  return normalized;
}

function optionalText(value, field, max = 300) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return requireText(value, field, { max });
}

function requireEmail(value) {
  const email = requireText(value, 'El correo', { max: 254 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, 'El correo no tiene un formato válido.');
  }
  return email;
}

function requirePassword(value, { min = 10 } = {}) {
  const password = requireText(value, 'La contraseña', { min, max: 200 });
  if (Buffer.byteLength(password, 'utf8') > 72) {
    throw new HttpError(400, 'La contraseña no puede superar 72 bytes UTF-8.');
  }
  return password;
}

function requireUuid(value, field = 'El identificador') {
  if (typeof value !== 'string'
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new HttpError(400, `${field} debe ser un UUID válido.`);
  }
  return value;
}

function requireBoolean(value, field) {
  if (typeof value !== 'boolean') {
    throw new HttpError(400, `${field} debe ser verdadero o falso.`);
  }
  return value;
}

module.exports = {
  optionalText,
  requireBoolean,
  requireEmail,
  requireObject,
  requirePassword,
  requireText,
  requireUuid,
};
