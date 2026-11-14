const { asyncHandler } = require('../../lib/asyncHandler');
const { requireUuid } = require('../../lib/validation');
const {
  validateBulkRoomNumbers,
  validateCreateRoom,
  validateRoomGroup,
  validateUpdateRoom,
} = require('./room.validation');
const roomService = require('./room.service');

const list = asyncHandler(async (req, res) => {
  res.json(await roomService.list(req.user.establecimiento_id));
});

const getSummary = asyncHandler(async (req, res) => {
  res.json(await roomService.getSummary(req.user.establecimiento_id));
});

const getById = asyncHandler(async (req, res) => {
  const roomId = requireUuid(req.params.id, 'La habitación');
  res.json(await roomService.getById(roomId, req.user.establecimiento_id));
});

const create = asyncHandler(async (req, res) => {
  const values = validateCreateRoom(req.body);
  res.status(201).json(await roomService.create(req.user, values));
});

const listGroups = asyncHandler(async (req, res) => {
  res.json(await roomService.listGroups(req.user.establecimiento_id));
});

const createGroup = asyncHandler(async (req, res) => {
  const values = validateRoomGroup(req.body);
  res.status(201).json(await roomService.createGroup(req.user, values));
});

const updateGroup = asyncHandler(async (req, res) => {
  const groupId = requireUuid(req.params.id, 'El grupo');
  const values = validateRoomGroup(req.body, false);
  res.json(await roomService.updateGroup(req.user, groupId, values));
});

const deleteGroup = asyncHandler(async (req, res) => {
  const groupId = requireUuid(req.params.id, 'El grupo');
  await roomService.deleteGroup(req.user, groupId);
  res.status(204).end();
});

const createFromGroup = asyncHandler(async (req, res) => {
  const groupId = requireUuid(req.params.id, 'El grupo');
  const numbers = validateBulkRoomNumbers(req.body);
  res.status(201).json(await roomService.createRoomsFromGroup(req.user, groupId, numbers));
});

const update = asyncHandler(async (req, res) => {
  const roomId = requireUuid(req.params.id, 'La habitación');
  const values = validateUpdateRoom(req.body);
  res.json(await roomService.update(req.user, roomId, values));
});

const remove = asyncHandler(async (req, res) => {
  const roomId = requireUuid(req.params.id, 'La habitación');
  await roomService.remove(req.user, roomId);
  res.status(204).end();
});

module.exports = {
  create,
  createFromGroup,
  createGroup,
  deleteGroup,
  getById,
  getSummary,
  list,
  listGroups,
  remove,
  update,
  updateGroup,
};
