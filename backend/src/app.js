const express = require('express');
const cors = require('cors');
const { asyncHandler } = require('./lib/asyncHandler');
const { pool } = require('./config/database');
const apiRoutes = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.set('port', Number(process.env.PORT) || 3000);
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  res.send('Bienvenido a la API de Hospedado.');
});

app.get('/health', asyncHandler(async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', database: 'connected' });
}));

app.use('/api', apiRoutes);
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});
app.use(errorHandler);

module.exports = app;
