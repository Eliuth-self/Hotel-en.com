const { pool } = require('../../config/database');

const PUBLIC_ESTABLISHMENT_SELECT = `
  SELECT e.id,
         e.nombre_comercial,
         e.tipo_establecimiento,
         e.direccion,
         e.latitud,
         e.longitud,
         e.telefono,
         e.whatsapp,
         e.correo,
         e.logo_url,
         e.descripcion,
         m.nombre AS municipio,
         d.nombre AS division_territorial,
         COALESCE((
           SELECT JSON_BUILD_OBJECT(
             'disponible', COUNT(*) FILTER (WHERE h.estado = 'disponible'),
             'ocupada', COUNT(*) FILTER (WHERE h.estado = 'ocupada'),
             'limpieza', COUNT(*) FILTER (WHERE h.estado = 'limpieza'),
             'mantenimiento', COUNT(*) FILTER (WHERE h.estado = 'mantenimiento')
           )
           FROM habitaciones h
           WHERE h.establecimiento_id = e.id
             AND h.estado <> 'inactiva'
         ), '{"disponible":0,"ocupada":0,"limpieza":0,"mantenimiento":0}'::JSON) AS resumen_habitaciones
    FROM establecimientos e
    LEFT JOIN municipios m ON m.id = e.municipio_id
    LEFT JOIN divisiones_territoriales d ON d.id = e.division_territorial_id
   WHERE e.estado = 'activo'
     AND e.visible_publicamente = TRUE
`;

async function findPublic(establishmentId) {
  const result = await pool.query(
    `${PUBLIC_ESTABLISHMENT_SELECT}
      AND e.id = $1`,
    [establishmentId],
  );
  return result.rows[0] || null;
}

async function searchPublic(query) {
  const params = [];
  let filter = '';
  if (query) {
    params.push(`%${query}%`);
    filter = `AND (
      e.nombre_comercial ILIKE $1
      OR COALESCE(m.nombre, '') ILIKE $1
      OR COALESCE(d.nombre, '') ILIKE $1
      OR COALESCE(e.direccion, '') ILIKE $1
    )`;
  }
  const result = await pool.query(
    `${PUBLIC_ESTABLISHMENT_SELECT}
      ${filter}
      ORDER BY e.nombre_comercial
      LIMIT 100`,
    params,
  );
  return result.rows;
}

async function findAvailableRooms(establishmentId) {
  const result = await pool.query(
    `SELECT h.ubicacion,
            h.minibar,
            h.contenido,
            h.resena,
            COALESCE(
              (SELECT JSON_AGG(
                JSON_BUILD_OBJECT(
                  'modalidad', t.modalidad,
                  'duracion_minutos', t.duracion_minutos,
                  'precio', t.precio,
                  'moneda', t.moneda
                ) ORDER BY t.precio
              )
               FROM tarifas_habitaciones t
               WHERE t.habitacion_id = h.id),
              '[]'::JSON
            ) AS tarifas
       FROM habitaciones h
      WHERE h.establecimiento_id = $1
        AND h.estado = 'disponible'
      ORDER BY h.ubicacion
      LIMIT 100`,
    [establishmentId],
  );
  return result.rows;
}

module.exports = { findAvailableRooms, findPublic, searchPublic };
