const { asyncHandler } = require('../../lib/asyncHandler');
const { requireUuid } = require('../../lib/validation');
const { validateCreateUser, validateUpdateUser } = require('./user.validation');
const userService = require('./user.service');

const list = asyncHandler(async (req, res) => {
  res.json(await userService.list(req.user.establecimiento_id));
});

const getById = asyncHandler(async (req, res) => {
  const userId = requireUuid(req.params.id, 'El usuario');
  res.json(await userService.getById(userId, req.user.establecimiento_id));
});

const create = asyncHandler(async (req, res) => {
  const values = validateCreateUser(req.body);
  res.status(201).json(await userService.create(req.user, values));
});

const update = asyncHandler(async (req, res) => {
  const userId = requireUuid(req.params.id, 'El usuario');
  const values = validateUpdateUser(req.body);
  res.json(await userService.update(req.user, userId, values));
});

const remove = asyncHandler(async (req, res) => {
  const userId = requireUuid(req.params.id, 'El usuario');
  await userService.remove(req.user, userId);
  res.status(204).end();
});

module.exports = { create, getById, list, remove, update };
