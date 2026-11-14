const { asyncHandler } = require('../../lib/asyncHandler');
const roleModel = require('./role.model');

const list = asyncHandler(async (req, res) => {
  res.json(await roleModel.findAll());
});

module.exports = { list };
