const { pool } = require('../../config/database');

const USER_SELECT = `
  SELECT u.id, u.establecimiento_id, u.nombres, u.apellidos, u.correo,
         u.telefono, u.estado, u.ultimo_acceso, u.created_at, u.updated_at,
         COALESCE(
           JSON_AGG(JSON_BUILD_OBJECT('codigo', r.codigo, 'nombre', r.nombre))
             FILTER (WHERE r.id IS NOT NULL),
           '[]'::JSON
         ) AS roles
    FROM usuarios u
    LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
    LEFT JOIN roles r ON r.id = ur.rol_id
`;

async function findAllByEstablishment(establishmentId) {
  const result = await pool.query(
    `${USER_SELECT}
      WHERE u.establecimiento_id = $1
      GROUP BY u.id
      ORDER BY u.apellidos, u.nombres`,
    [establishmentId],
  );
  return result.rows;
}

async function findById(userId, establishmentId, client = pool) {
  const result = await client.query(
    `${USER_SELECT}
      WHERE u.id = $1 AND u.establecimiento_id = $2
      GROUP BY u.id`,
    [userId, establishmentId],
  );
  return result.rows[0] || null;
}

async function create(client, establishmentId, values, passwordHash) {
  const result = await client.query(
    `INSERT INTO usuarios
      (establecimiento_id, nombres, apellidos, correo, password_hash, telefono)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, establecimiento_id, nombres, apellidos, correo, telefono,
               estado, ultimo_acceso, created_at, updated_at`,
    [
      establishmentId,
      values.nombres,
      values.apellidos,
      values.correo,
      passwordHash,
      values.telefono,
    ],
  );
  return result.rows[0];
}

async function replaceRoles(client, userId, roles) {
  await client.query('DELETE FROM usuario_roles WHERE usuario_id = $1', [userId]);
  const result = await client.query(
    `INSERT INTO usuario_roles (usuario_id, rol_id)
     SELECT $1, id FROM roles WHERE codigo = ANY($2::VARCHAR[])
     RETURNING rol_id`,
    [userId, roles],
  );
  if (result.rowCount !== roles.length) {
    throw new Error('One or more requested roles are missing from the database.');
  }
}

async function findRoles(client, userId) {
  const result = await client.query(
    `SELECT r.codigo, r.nombre
       FROM usuario_roles ur
       JOIN roles r ON r.id = ur.rol_id
      WHERE ur.usuario_id = $1
      ORDER BY r.codigo`,
    [userId],
  );
  return result.rows;
}

async function updateById(client, userId, establishmentId, values) {
  const fields = Object.keys(values);
  const assignments = fields.map((field, index) => `${field} = $${index + 1}`);
  assignments.push('updated_at = NOW()');
  const result = await client.query(
    `UPDATE usuarios
        SET ${assignments.join(', ')}
      WHERE id = $${fields.length + 1}
        AND establecimiento_id = $${fields.length + 2}
      RETURNING id, establecimiento_id, nombres, apellidos, correo, telefono,
                estado, ultimo_acceso, created_at, updated_at`,
    [...fields.map((field) => values[field]), userId, establishmentId],
  );
  return result.rows[0] || null;
}

async function revokeSessions(client, userId) {
  await client.query(
    'UPDATE sesiones SET revoked_at = NOW() WHERE usuario_id = $1 AND revoked_at IS NULL',
    [userId],
  );
}

async function deactivate(client, userId, establishmentId) {
  const result = await client.query(
    `UPDATE usuarios
        SET estado = FALSE, updated_at = NOW()
      WHERE id = $1 AND establecimiento_id = $2 AND estado = TRUE
      RETURNING id`,
    [userId, establishmentId],
  );
  return result.rows[0] || null;
}

module.exports = {
  create,
  deactivate,
  findAllByEstablishment,
  findById,
  findRoles,
  replaceRoles,
  revokeSessions,
  updateById,
};
