const bcrypt = require('bcryptjs');
const { withTransaction } = require('../../database/transaction');
const { HttpError } = require('../../lib/httpError');
const { recordAudit } = require('../../lib/audit');
const userModel = require('./user.model');

const UPDATABLE_FIELDS = new Set([
  'nombres',
  'apellidos',
  'correo',
  'telefono',
  'estado',
  'password_hash',
]);

async function list(establishmentId) {
  return userModel.findAllByEstablishment(establishmentId);
}

async function getById(userId, establishmentId) {
  const user = await userModel.findById(userId, establishmentId);
  if (!user) {
    throw new HttpError(404, 'No se encontró el usuario.');
  }
  return user;
}

async function create(actor, values) {
  const passwordHash = await bcrypt.hash(values.password, 12);
  return withTransaction(async (client) => {
    const user = await userModel.create(
      client,
      actor.establecimiento_id,
      values,
      passwordHash,
    );
    await userModel.replaceRoles(client, user.id, values.roles);
    await recordAudit(client, {
      establishmentId: actor.establecimiento_id,
      userId: actor.id,
      action: 'usuario_creado',
      entity: 'usuarios',
      recordId: user.id,
      details: { roles: values.roles },
    });

    return { ...user, roles: await userModel.findRoles(client, user.id) };
  });
}

async function update(actor, userId, values) {
  if (userId === actor.id
    && (values.estado === false
      || (values.roles && !values.roles.includes('administrador')))) {
    throw new HttpError(400, 'No puedes desactivar ni quitarte el rol de administrador.');
  }

  const updateValues = { ...values };
  if (updateValues.password) {
    updateValues.password_hash = await bcrypt.hash(updateValues.password, 12);
    delete updateValues.password;
  }

  const fields = Object.keys(updateValues).filter((field) => field !== 'roles');
  const databaseValues = Object.fromEntries(
    fields.map((field) => [field, updateValues[field]]),
  );
  if (Object.keys(databaseValues).some((field) => !UPDATABLE_FIELDS.has(field))) {
    throw new Error('User update contains a non-editable database field.');
  }

  return withTransaction(async (client) => {
    const user = await userModel.updateById(
      client,
      userId,
      actor.establecimiento_id,
      databaseValues,
    );
    if (!user) {
      throw new HttpError(404, 'No se encontró el usuario.');
    }

    if (updateValues.roles) {
      await userModel.replaceRoles(client, userId, updateValues.roles);
    }
    if (updateValues.estado === false || updateValues.password_hash) {
      await userModel.revokeSessions(client, userId);
    }

    const roles = await userModel.findRoles(client, userId);
    await recordAudit(client, {
      establishmentId: actor.establecimiento_id,
      userId: actor.id,
      action: 'usuario_actualizado',
      entity: 'usuarios',
      recordId: userId,
      details: { fields: [...fields, ...(updateValues.roles ? ['roles'] : [])] },
    });
    return { ...user, roles };
  });
}

async function remove(actor, userId) {
  if (userId === actor.id) {
    throw new HttpError(400, 'No puedes desactivar tu propio usuario.');
  }

  await withTransaction(async (client) => {
    const user = await userModel.deactivate(client, userId, actor.establecimiento_id);
    if (!user) {
      throw new HttpError(404, 'No se encontró un usuario activo con ese identificador.');
    }
    await userModel.revokeSessions(client, userId);
    await recordAudit(client, {
      establishmentId: actor.establecimiento_id,
      userId: actor.id,
      action: 'usuario_desactivado',
      entity: 'usuarios',
      recordId: userId,
    });
  });
}

module.exports = { create, getById, list, remove, update };
