const { withTransaction } = require('../../database/transaction');
const { HttpError } = require('../../lib/httpError');
const { recordAudit } = require('../../lib/audit');
const roomModel = require('./room.model');

async function list(establishmentId) {
  return roomModel.findAll(establishmentId);
}

async function getById(roomId, establishmentId) {
  const room = await roomModel.findById(roomId, establishmentId);
  if (!room) {
    throw new HttpError(404, 'No se encontró la habitación.');
  }
  return room;
}

async function getSummary(establishmentId) {
  return roomModel.getSummary(establishmentId);
}

async function create(actor, values) {
  return withTransaction(async (client) => {
    const created = await roomModel.create(client, actor.establecimiento_id, values);
    await roomModel.replaceRates(client, created.id, values.tarifas);
    const room = await roomModel.findById(
      created.id,
      actor.establecimiento_id,
      client,
    );
    await recordAudit(client, {
      establishmentId: actor.establecimiento_id,
      userId: actor.id,
      action: 'habitacion_creada',
      entity: 'habitaciones',
      recordId: room.id,
      details: { numero: room.numero, tarifas: values.tarifas.length },
    });
    return room;
  });
}

async function listGroups(establishmentId) {
  return roomModel.findAllGroups(establishmentId);
}

async function createGroup(actor, values) {
  return withTransaction(async (client) => {
    const group = await roomModel.createGroup(client, actor.establecimiento_id, values);
    await recordAudit(client, {
      establishmentId: actor.establecimiento_id,
      userId: actor.id,
      action: 'grupo_habitaciones_creado',
      entity: 'grupos_habitaciones',
      recordId: group.id,
      details: { nombre: group.nombre },
    });
    return group;
  });
}

async function updateGroup(actor, groupId, values) {
  return withTransaction(async (client) => {
    const group = await roomModel.updateGroupById(
      client,
      groupId,
      actor.establecimiento_id,
      values,
    );
    if (!group) {
      throw new HttpError(404, 'No se encontró el grupo de habitaciones.');
    }
    await recordAudit(client, {
      establishmentId: actor.establecimiento_id,
      userId: actor.id,
      action: 'grupo_habitaciones_actualizado',
      entity: 'grupos_habitaciones',
      recordId: groupId,
      details: { fields: Object.keys(values) },
    });
    return group;
  });
}

async function deleteGroup(actor, groupId) {
  await withTransaction(async (client) => {
    const group = await roomModel.deleteGroupById(
      client,
      groupId,
      actor.establecimiento_id,
    );
    if (!group) {
      throw new HttpError(404, 'No se encontró el grupo de habitaciones.');
    }
    await recordAudit(client, {
      establishmentId: actor.establecimiento_id,
      userId: actor.id,
      action: 'grupo_habitaciones_eliminado',
      entity: 'grupos_habitaciones',
      recordId: groupId,
    });
  });
}

async function createRoomsFromGroup(actor, groupId, numbers) {
  try {
    return await withTransaction(async (client) => {
      const group = await roomModel.findGroupById(
        groupId,
        actor.establecimiento_id,
        client,
      );
      if (!group) {
        throw new HttpError(404, 'No se encontró el grupo de habitaciones.');
      }
      const rooms = await roomModel.createRoomsFromGroup(
        client,
        actor.establecimiento_id,
        group,
        numbers,
      );
      await recordAudit(client, {
        establishmentId: actor.establecimiento_id,
        userId: actor.id,
        action: 'habitaciones_creadas_desde_grupo',
        entity: 'grupos_habitaciones',
        recordId: groupId,
        details: { cantidad: rooms.length, numeros: rooms.map((room) => room.numero) },
      });
      return rooms;
    });
  } catch (error) {
    if (error.code === '23505') {
      throw new HttpError(409, 'Uno o más números ya pertenecen a habitaciones existentes.');
    }
    throw error;
  }
}

async function update(actor, roomId, values) {
  return withTransaction(async (client) => {
    const currentRoom = await roomModel.lockById(
      client,
      roomId,
      actor.establecimiento_id,
    );
    if (!currentRoom) {
      throw new HttpError(404, 'No se encontró la habitación.');
    }
    const hasActiveStay = await roomModel.hasActiveStay(client, roomId);
    if ((hasActiveStay && values.estado && values.estado !== 'ocupada')
      || (!hasActiveStay && values.estado === 'ocupada')) {
      throw new HttpError(
        409,
        'El estado de ocupación se actualiza mediante el check-in y el check-out de la estadía.',
      );
    }

    const room = await roomModel.updateById(
      client,
      roomId,
      actor.establecimiento_id,
      values,
    );
    if (!room) {
      throw new HttpError(404, 'No se encontró la habitación.');
    }
    await recordAudit(client, {
      establishmentId: actor.establecimiento_id,
      userId: actor.id,
      action: 'habitacion_actualizada',
      entity: 'habitaciones',
      recordId: roomId,
      details: { fields: Object.keys(values) },
    });
    return room;
  });
}

async function remove(actor, roomId) {
  await withTransaction(async (client) => {
    const currentRoom = await roomModel.lockById(client, roomId, actor.establecimiento_id);
    if (!currentRoom) {
      throw new HttpError(404, 'No se encontró una habitación activa con ese identificador.');
    }
    if (await roomModel.hasActiveStay(client, roomId)) {
      throw new HttpError(409, 'No puedes desactivar una habitación con una estadía activa.');
    }
    const room = await roomModel.deactivate(client, roomId, actor.establecimiento_id);
    if (!room) {
      throw new HttpError(404, 'No se encontró una habitación activa con ese identificador.');
    }
    await recordAudit(client, {
      establishmentId: actor.establecimiento_id,
      userId: actor.id,
      action: 'habitacion_desactivada',
      entity: 'habitaciones',
      recordId: roomId,
    });
  });
}

module.exports = {
  create,
  createGroup,
  createRoomsFromGroup,
  deleteGroup,
  getById,
  getSummary,
  list,
  listGroups,
  remove,
  update,
  updateGroup,
};
