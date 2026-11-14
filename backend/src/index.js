const { start } = require('./server');
const { pool } = require('./config/database');

start().catch(async (error) => {
  console.error('No se pudo iniciar la API:', error);
  await pool.end();
  process.exitCode = 1;
});
