const { asyncHandler } = require('../../lib/asyncHandler');
const { validateCompanyUpdate } = require('./company.validation');
const companyService = require('./company.service');

const getMine = asyncHandler(async (req, res) => {
  res.json(await companyService.getMine(req.user));
});

const updateMine = asyncHandler(async (req, res) => {
  const values = validateCompanyUpdate(req.body);
  res.json(await companyService.updateMine(req.user, values));
});

module.exports = { getMine, updateMine };
