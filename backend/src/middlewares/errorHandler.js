function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.code === '23505') {
    return res.status(409).json({ error: 'Ya existe un registro con esos datos.' });
  }

  if (error.code === '23503' || error.code === '23514' || error.code === '22P02') {
    return res.status(400).json({ error: 'Los datos enviados no son válidos.' });
  }

  const status = Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) {
    console.error('Unhandled API error:', error);
  }

  return res.status(status).json({
    error: status >= 500 ? 'Error interno del servidor.' : error.message,
  });
}

module.exports = { errorHandler };
