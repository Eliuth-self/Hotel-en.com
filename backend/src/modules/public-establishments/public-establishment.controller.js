const { asyncHandler } = require('../../lib/asyncHandler');
const { requireText, requireUuid } = require('../../lib/validation');
const { HttpError } = require('../../lib/httpError');
const publicEstablishmentService = require('./public-establishment.service');

const search = asyncHandler(async (req, res) => {
  if (req.query.q !== undefined
    && (typeof req.query.q !== 'string' || req.query.q.trim().length > 120)) {
    throw new HttpError(400, 'La búsqueda debe ser texto de hasta 120 caracteres.');
  }
  const query = req.query.q ? requireText(req.query.q, 'La búsqueda', { max: 120 }) : '';
  res.json(await publicEstablishmentService.search(query));
});

const getById = asyncHandler(async (req, res) => {
  const establishmentId = requireUuid(req.params.id, 'El establecimiento');
  res.json(await publicEstablishmentService.getById(establishmentId));
});

module.exports = { getById, search };
