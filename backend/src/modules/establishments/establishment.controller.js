const { asyncHandler } = require('../../lib/asyncHandler');
const { validateEstablishmentUpdate } = require('./establishment.validation');
const establishmentService = require('./establishment.service');

const getMine = asyncHandler(async (req, res) => {
  res.json(await establishmentService.getMine(req.user));
});

const updateMine = asyncHandler(async (req, res) => {
  const values = validateEstablishmentUpdate(req.body);
  res.json(await establishmentService.updateMine(req.user, values));
});

module.exports = { getMine, updateMine };
