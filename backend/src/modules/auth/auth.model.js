const { pool } = require('../../config/database');

async function findUserForLogin(email, client = pool) {
  const result = await client.query(
    `SELECT u.id, u.establecimiento_id, u.nombres, u.apellidos, u.correo, u.telefono,
            u.password_hash,
            COALESCE(ARRAY_AGG(DISTINCT r.codigo)
              FILTER (WHERE r.codigo IS NOT NULL), '{}') AS roles
       FROM usuarios u
       JOIN establecimientos e ON e.id = u.establecimiento_id
       JOIN empresas emp ON emp.id = e.empresa_id
       LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
       LEFT JOIN roles r ON r.id = ur.rol_id
      WHERE LOWER(u.correo) = $1
        AND u.estado = TRUE
        AND e.estado = 'activo'
        AND emp.estado = 'activa'
      GROUP BY u.id`,
    [email],
  );
  return result.rows[0] || null;
}

async function updateLastLogin(client, userId) {
  await client.query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1', [userId]);
}

async function insertSession(client, jti, userId) {
  await client.query(
    `INSERT INTO sesiones (jti, usuario_id, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '12 hours')`,
    [jti, userId],
  );
}

async function revokeSession(client, jti) {
  await client.query(
    'UPDATE sesiones SET revoked_at = NOW() WHERE jti = $1 AND revoked_at IS NULL',
    [jti],
  );
}

async function findActiveSession(jti, userId) {
  const result = await pool.query(
    `SELECT u.id, u.establecimiento_id, u.nombres, u.apellidos, u.correo, u.telefono,
            e.empresa_id,
            COALESCE(ARRAY_AGG(DISTINCT r.codigo)
              FILTER (WHERE r.codigo IS NOT NULL), '{}') AS roles
       FROM sesiones s
       JOIN usuarios u ON u.id = s.usuario_id
       JOIN establecimientos e ON e.id = u.establecimiento_id
       JOIN empresas emp ON emp.id = e.empresa_id
       LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
       LEFT JOIN roles r ON r.id = ur.rol_id
      WHERE s.jti = $1
        AND s.usuario_id = $2
        AND s.revoked_at IS NULL
        AND s.expires_at > NOW()
        AND u.estado = TRUE
        AND e.estado = 'activo'
        AND emp.estado = 'activa'
      GROUP BY u.id, e.empresa_id`,
    [jti, userId],
  );
  return result.rows[0] || null;
}

module.exports = {
  findActiveSession,
  findUserForLogin,
  insertSession,
  revokeSession,
  updateLastLogin,
};
