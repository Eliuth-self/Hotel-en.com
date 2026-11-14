const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { withTransaction } = require('../../database/transaction');
const { recordAudit } = require('../../lib/audit');
const { HttpError } = require('../../lib/httpError');
const authModel = require('./auth.model');

const SESSION_TTL_SECONDS = 12 * 60 * 60;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters.');
  }
  return secret;
}

async function createSession(client, user, roles, action) {
  const jti = crypto.randomUUID();
  await authModel.insertSession(client, jti, user.id);

  const token = jwt.sign(
    { jti },
    getJwtSecret(),
    { subject: user.id, expiresIn: SESSION_TTL_SECONDS },
  );

  await recordAudit(client, {
    establishmentId: user.establecimiento_id,
    userId: user.id,
    action,
    entity: 'sesiones',
    recordId: jti,
  });

  return {
    token,
    expiresIn: SESSION_TTL_SECONDS,
    user: {
      id: user.id,
      establecimiento_id: user.establecimiento_id,
      nombres: user.nombres,
      apellidos: user.apellidos,
      correo: user.correo,
      telefono: user.telefono,
      roles,
    },
  };
}

async function login(email, password) {
  return withTransaction(async (client) => {
    const user = await authModel.findUserForLogin(email, client);
    const passwordMatches = user
      ? await bcrypt.compare(password, user.password_hash)
      : false;
    if (!passwordMatches) {
      throw new HttpError(401, 'Correo o contraseña incorrectos.');
    }

    await authModel.updateLastLogin(client, user.id);
    return createSession(client, user, user.roles, 'inicio_sesion');
  });
}

async function logout(user, sessionId) {
  await withTransaction(async (client) => {
    await authModel.revokeSession(client, sessionId);
    await recordAudit(client, {
      establishmentId: user.establecimiento_id,
      userId: user.id,
      action: 'cierre_sesion',
      entity: 'sesiones',
      recordId: sessionId,
    });
  });
}

module.exports = { createSession, getJwtSecret, login, logout };
