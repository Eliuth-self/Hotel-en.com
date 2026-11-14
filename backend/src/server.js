require('dotenv').config();

const app = require('./app');
const { assertDatabaseConfiguration, pool } = require('./config/database');
const { getJwtSecret } = require('./modules/auth/auth.service');

async function start() {
  assertDatabaseConfiguration();
  getJwtSecret();
  await pool.query('SELECT 1');

  const server = await new Promise((resolve, reject) => {
    const listeningServer = app.listen(app.get('port'));
    listeningServer.once('error', reject);
    listeningServer.once('listening', () => resolve(listeningServer));
  });

  console.log(`API de Hospedado escuchando en el puerto ${server.address().port}`);
  return server;
}

if (require.main === module) {
  start().catch(async (error) => {
    console.error('No se pudo iniciar la API:', error);
    await pool.end();
    process.exitCode = 1;
  });
}

module.exports = { start };
