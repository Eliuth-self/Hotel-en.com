const { pool } = require('../../config/database');

async function findById(companyId) {
  const result = await pool.query(
    `SELECT id, razon_social, tipo_documento, numero_documento,
            correo_contacto, telefono, estado, created_at, updated_at
       FROM empresas
      WHERE id = $1`,
    [companyId],
  );
  return result.rows[0] || null;
}

async function updateById(client, companyId, values) {
  const fields = Object.keys(values);
  const assignments = fields.map((field, index) => `${field} = $${index + 1}`);
  assignments.push('updated_at = NOW()');
  const result = await client.query(
    `UPDATE empresas
        SET ${assignments.join(', ')}
      WHERE id = $${fields.length + 1}
      RETURNING id, razon_social, tipo_documento, numero_documento,
                correo_contacto, telefono, estado, created_at, updated_at`,
    [...fields.map((field) => values[field]), companyId],
  );
  return result.rows[0] || null;
}

module.exports = { findById, updateById };
