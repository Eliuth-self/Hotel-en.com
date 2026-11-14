const { pool } = require('../../config/database');

async function findById(establishmentId) {
  const result = await pool.query(
    `SELECT e.id, e.empresa_id, e.nombre_comercial, e.tipo_establecimiento,
            e.municipio_id, e.division_territorial_id, e.direccion,
            e.latitud, e.longitud, e.telefono, e.whatsapp, e.correo,
            e.logo_url, e.descripcion, e.estado, e.visible_publicamente,
            e.created_at, e.updated_at
       FROM establecimientos e
      WHERE e.id = $1`,
    [establishmentId],
  );
  return result.rows[0] || null;
}

async function findMunicipalityId(client, establishmentId) {
  const result = await client.query(
    'SELECT municipio_id FROM establecimientos WHERE id = $1',
    [establishmentId],
  );
  return result.rows[0]?.municipio_id;
}

async function divisionBelongsToMunicipality(client, divisionId, municipalityId) {
  const result = await client.query(
    `SELECT 1 FROM divisiones_territoriales
      WHERE id = $1 AND municipio_id = $2 AND estado = TRUE`,
    [divisionId, municipalityId],
  );
  return result.rowCount > 0;
}

async function updateById(client, establishmentId, values) {
  const fields = Object.keys(values);
  const assignments = fields.map((field, index) => `${field} = $${index + 1}`);
  assignments.push('updated_at = NOW()');
  const result = await client.query(
    `UPDATE establecimientos
        SET ${assignments.join(', ')}
      WHERE id = $${fields.length + 1}
      RETURNING id, empresa_id, nombre_comercial, tipo_establecimiento, municipio_id,
                division_territorial_id, direccion, latitud, longitud, telefono, whatsapp,
                correo, logo_url, descripcion, estado, visible_publicamente,
                created_at, updated_at`,
    [...fields.map((field) => values[field]), establishmentId],
  );
  return result.rows[0] || null;
}

module.exports = {
  divisionBelongsToMunicipality,
  findById,
  findMunicipalityId,
  updateById,
};
