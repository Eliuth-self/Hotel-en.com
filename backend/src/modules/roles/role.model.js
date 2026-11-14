const { pool } = require('../../config/database');

async function findAll() {
  const result = await pool.query(
    'SELECT id, codigo, nombre, descripcion FROM roles ORDER BY nombre',
  );
  return result.rows;
}

module.exports = { findAll };
