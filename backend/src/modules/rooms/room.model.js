const { pool } = require('../../config/database');

const ROOM_SELECT = `
  SELECT h.id, h.establecimiento_id, h.numero, h.ubicacion, h.estado,
         h.minibar, h.resena, h.contenido, h.created_at, h.updated_at,
         COALESCE(
           (SELECT JSON_AGG(
             JSON_BUILD_OBJECT(
               'id', t.id,
               'modalidad', t.modalidad,
               'duracion_minutos', t.duracion_minutos,
               'precio', t.precio,
               'moneda', t.moneda
             ) ORDER BY t.modalidad, t.duracion_minutos
           )
            FROM tarifas_habitaciones t
            WHERE t.habitacion_id = h.id),
           '[]'::JSON
         ) AS tarifas
    FROM habitaciones h
`;

async function findAll(establishmentId) {
  const result = await pool.query(
    `${ROOM_SELECT}
      WHERE h.establecimiento_id = $1
      ORDER BY h.numero`,
    [establishmentId],
  );
  return result.rows;
}

async function findById(roomId, establishmentId, client = pool) {
  const result = await client.query(
    `${ROOM_SELECT}
      WHERE h.id = $1 AND h.establecimiento_id = $2`,
    [roomId, establishmentId],
  );
  return result.rows[0] || null;
}

async function create(client, establishmentId, values) {
  const result = await client.query(
    `INSERT INTO habitaciones
      (establecimiento_id, numero, ubicacion, estado, minibar, resena, contenido)
     VALUES ($1, $2, $3, $4, $5, $6, $7::JSONB)
     RETURNING id`,
    [
      establishmentId,
      values.numero,
      values.ubicacion,
      values.estado,
      values.minibar,
      values.resena,
      JSON.stringify(values.contenido),
    ],
  );
  return result.rows[0];
}

async function replaceRates(client, roomId, rates) {
  await client.query('DELETE FROM tarifas_habitaciones WHERE habitacion_id = $1', [roomId]);
  for (const rate of rates) {
    await client.query(
      `INSERT INTO tarifas_habitaciones
        (habitacion_id, modalidad, duracion_minutos, precio, moneda)
       VALUES ($1, $2, $3, $4, $5)`,
      [roomId, rate.modalidad, rate.duracion_minutos, rate.precio, rate.moneda],
    );
  }
}

async function findAllGroups(establishmentId) {
  const result = await pool.query(
    `SELECT g.id, g.establecimiento_id, g.nombre, g.ubicacion, g.minibar,
            g.resena, g.contenido, g.created_at, g.updated_at,
            COALESCE(
              (SELECT JSON_AGG(
                JSON_BUILD_OBJECT(
                  'id', t.id,
                  'modalidad', t.modalidad,
                  'duracion_minutos', t.duracion_minutos,
                  'precio', t.precio,
                  'moneda', t.moneda
                ) ORDER BY t.modalidad, t.duracion_minutos
              )
               FROM tarifas_grupos_habitaciones t
               WHERE t.grupo_id = g.id),
              '[]'::JSON
            ) AS tarifas
       FROM grupos_habitaciones g
      WHERE g.establecimiento_id = $1
      ORDER BY g.nombre`,
    [establishmentId],
  );
  return result.rows;
}

async function findGroupById(groupId, establishmentId, client = pool) {
  const result = await client.query(
    `SELECT g.id, g.establecimiento_id, g.nombre, g.ubicacion, g.minibar,
            g.resena, g.contenido, g.created_at, g.updated_at,
            COALESCE(
              (SELECT JSON_AGG(
                JSON_BUILD_OBJECT(
                  'id', t.id,
                  'modalidad', t.modalidad,
                  'duracion_minutos', t.duracion_minutos,
                  'precio', t.precio,
                  'moneda', t.moneda
                ) ORDER BY t.modalidad, t.duracion_minutos
              )
               FROM tarifas_grupos_habitaciones t
               WHERE t.grupo_id = g.id),
              '[]'::JSON
            ) AS tarifas
       FROM grupos_habitaciones g
      WHERE g.id = $1 AND g.establecimiento_id = $2`,
    [groupId, establishmentId],
  );
  return result.rows[0] || null;
}

async function replaceGroupRates(client, groupId, rates) {
  await client.query('DELETE FROM tarifas_grupos_habitaciones WHERE grupo_id = $1', [groupId]);
  for (const rate of rates) {
    await client.query(
      `INSERT INTO tarifas_grupos_habitaciones
        (grupo_id, modalidad, duracion_minutos, precio, moneda)
       VALUES ($1, $2, $3, $4, $5)`,
      [groupId, rate.modalidad, rate.duracion_minutos, rate.precio, rate.moneda],
    );
  }
}

async function createGroup(client, establishmentId, values) {
  const result = await client.query(
    `INSERT INTO grupos_habitaciones
      (establecimiento_id, nombre, ubicacion, minibar, resena, contenido)
     VALUES ($1, $2, $3, $4, $5, $6::JSONB)
     RETURNING id`,
    [
      establishmentId,
      values.nombre,
      values.ubicacion,
      values.minibar,
      values.resena,
      JSON.stringify(values.contenido),
    ],
  );
  await replaceGroupRates(client, result.rows[0].id, values.tarifas);
  return findGroupById(result.rows[0].id, establishmentId, client);
}

async function updateGroupById(client, groupId, establishmentId, values) {
  const existing = await client.query(
    `SELECT id FROM grupos_habitaciones
      WHERE id = $1 AND establecimiento_id = $2
      FOR UPDATE`,
    [groupId, establishmentId],
  );
  if (existing.rowCount === 0) {
    return null;
  }

  const fields = Object.keys(values).filter((field) => field !== 'tarifas');
  if (fields.length > 0) {
    const assignments = fields.map((field, index) => (
      `${field} = $${index + 1}${field === 'contenido' ? '::JSONB' : ''}`
    ));
    assignments.push('updated_at = NOW()');
    const params = fields.map((field) => (
      field === 'contenido' ? JSON.stringify(values[field]) : values[field]
    ));
    await client.query(
      `UPDATE grupos_habitaciones
          SET ${assignments.join(', ')}
        WHERE id = $${fields.length + 1} AND establecimiento_id = $${fields.length + 2}`,
      [...params, groupId, establishmentId],
    );
  }
  if (values.tarifas) {
    await replaceGroupRates(client, groupId, values.tarifas);
  }
  return findGroupById(groupId, establishmentId, client);
}

async function deleteGroupById(client, groupId, establishmentId) {
  const result = await client.query(
    `DELETE FROM grupos_habitaciones
      WHERE id = $1 AND establecimiento_id = $2
      RETURNING id`,
    [groupId, establishmentId],
  );
  return result.rows[0] || null;
}

async function createRoomsFromGroup(client, establishmentId, group, numbers) {
  const rooms = await client.query(
    `INSERT INTO habitaciones
      (establecimiento_id, numero, ubicacion, estado, minibar, resena, contenido)
     SELECT $1, n.numero, $3, 'disponible', $4, $5, $6::JSONB
       FROM UNNEST($2::VARCHAR[]) AS n(numero)
     RETURNING id`,
    [
      establishmentId,
      numbers,
      group.ubicacion,
      group.minibar,
      group.resena,
      JSON.stringify(group.contenido),
    ],
  );
  const roomIds = rooms.rows.map((room) => room.id);
  await client.query(
    `INSERT INTO tarifas_habitaciones
      (habitacion_id, modalidad, duracion_minutos, precio, moneda)
     SELECT room.id,
            rate.modalidad,
            rate.duracion_minutos,
            rate.precio,
            rate.moneda
       FROM UNNEST($1::UUID[]) AS room(id)
       CROSS JOIN JSONB_TO_RECORDSET($2::JSONB) AS rate(
         modalidad VARCHAR(100),
         duracion_minutos INTEGER,
         precio NUMERIC(12, 2),
         moneda CHAR(3)
       )`,
    [roomIds, JSON.stringify(group.tarifas)],
  );
  const created = await client.query(
    `${ROOM_SELECT}
      WHERE h.establecimiento_id = $1 AND h.id = ANY($2::UUID[])
      ORDER BY h.numero`,
    [establishmentId, roomIds],
  );
  return created.rows;
}

async function updateById(client, roomId, establishmentId, values) {
  const existing = await client.query(
    `SELECT id FROM habitaciones
      WHERE id = $1 AND establecimiento_id = $2
      FOR UPDATE`,
    [roomId, establishmentId],
  );
  if (existing.rowCount === 0) {
    return null;
  }

  const fields = Object.keys(values).filter((field) => field !== 'tarifas');
  if (fields.length > 0) {
    const assignments = fields.map((field, index) => (
      `${field} = $${index + 1}${field === 'contenido' ? `::JSONB` : ''}`
    ));
    assignments.push('updated_at = NOW()');
    const params = fields.map((field) => (
      field === 'contenido' ? JSON.stringify(values[field]) : values[field]
    ));
    await client.query(
      `UPDATE habitaciones
          SET ${assignments.join(', ')}
        WHERE id = $${fields.length + 1} AND establecimiento_id = $${fields.length + 2}`,
      [...params, roomId, establishmentId],
    );
  }

  if (values.tarifas) {
    await replaceRates(client, roomId, values.tarifas);
  }
  return findById(roomId, establishmentId, client);
}

async function lockById(client, roomId, establishmentId) {
  const result = await client.query(
    `SELECT id, estado FROM habitaciones
      WHERE id = $1 AND establecimiento_id = $2
      FOR UPDATE`,
    [roomId, establishmentId],
  );
  return result.rows[0] || null;
}

async function hasActiveStay(client, roomId) {
  const result = await client.query(
    `SELECT 1 FROM estadias
      WHERE habitacion_id = $1 AND estado = 'activa'
      LIMIT 1`,
    [roomId],
  );
  return result.rowCount > 0;
}

async function deactivate(client, roomId, establishmentId) {
  const result = await client.query(
    `UPDATE habitaciones
        SET estado = 'inactiva', updated_at = NOW()
      WHERE id = $1 AND establecimiento_id = $2 AND estado <> 'inactiva'
      RETURNING id`,
    [roomId, establishmentId],
  );
  return result.rows[0] || null;
}

async function getSummary(establishmentId) {
  const result = await pool.query(
    `SELECT COUNT(*)::INTEGER AS total,
            COUNT(*) FILTER (WHERE estado = 'disponible')::INTEGER AS disponibles,
            COUNT(*) FILTER (WHERE estado = 'ocupada')::INTEGER AS ocupadas,
            COUNT(*) FILTER (WHERE estado = 'mantenimiento')::INTEGER AS mantenimiento,
            COUNT(*) FILTER (WHERE estado = 'limpieza')::INTEGER AS limpieza,
            COUNT(*) FILTER (WHERE estado = 'inactiva')::INTEGER AS inactivas
       FROM habitaciones
      WHERE establecimiento_id = $1`,
    [establishmentId],
  );
  return result.rows[0];
}

module.exports = {
  create,
  createGroup,
  createRoomsFromGroup,
  deactivate,
  deleteGroupById,
  findAll,
  findAllGroups,
  findById,
  findGroupById,
  getSummary,
  hasActiveStay,
  lockById,
  replaceGroupRates,
  replaceRates,
  updateGroupById,
  updateById,
};
