const { asyncHandler } = require('../../lib/asyncHandler');
const { requireUuid } = require('../../lib/validation');
const {
  validateCheckIn,
  validateCashClose,
  validateLocation,
  validatePayment,
  validateProduct,
  validateSale,
  validateStockChange,
  validateStayCharge,
  validateTransfer,
} = require('./operations.validation');
const operationsService = require('./operations.service');

const listProducts = asyncHandler(async (req, res) => {
  res.json(await operationsService.listProducts(req.user.establecimiento_id));
});

const createProduct = asyncHandler(async (req, res) => {
  res.status(201).json(await operationsService.createProduct(
    req.user,
    validateProduct(req.body),
  ));
});

const updateProduct = asyncHandler(async (req, res) => {
  const productId = requireUuid(req.params.id, 'El producto');
  res.json(await operationsService.updateProduct(
    req.user,
    productId,
    validateProduct(req.body),
  ));
});

const listLocations = asyncHandler(async (req, res) => {
  res.json(await operationsService.listLocations(req.user.establecimiento_id));
});

const createLocation = asyncHandler(async (req, res) => {
  res.status(201).json(await operationsService.createLocation(
    req.user,
    validateLocation(req.body),
  ));
});

const listMovements = asyncHandler(async (req, res) => {
  res.json(await operationsService.listMovements(req.user.establecimiento_id));
});

const changeStock = asyncHandler(async (req, res) => {
  res.status(201).json(await operationsService.changeStock(
    req.user,
    validateStockChange(req.body),
  ));
});

const transferStock = asyncHandler(async (req, res) => {
  res.status(201).json(await operationsService.transferStock(
    req.user,
    validateTransfer(req.body),
  ));
});

const listActiveStays = asyncHandler(async (req, res) => {
  res.json(await operationsService.listActiveStays(req.user.establecimiento_id));
});

const checkIn = asyncHandler(async (req, res) => {
  res.status(201).json(await operationsService.checkIn(req.user, validateCheckIn(req.body)));
});

const addStayCharge = asyncHandler(async (req, res) => {
  const stayId = requireUuid(req.params.id, 'La estadía');
  res.status(201).json(await operationsService.addStayCharge(
    req.user,
    stayId,
    validateStayCharge(req.body),
  ));
});

const checkout = asyncHandler(async (req, res) => {
  const stayId = requireUuid(req.params.id, 'La estadía');
  res.json(await operationsService.checkout(
    req.user,
    stayId,
    validatePayment(req.body),
  ));
});

const createSale = asyncHandler(async (req, res) => {
  res.status(201).json(await operationsService.createSale(req.user, validateSale(req.body)));
});

const getRevenue = asyncHandler(async (req, res) => {
  res.json(await operationsService.getRevenue(
    req.user.establecimiento_id,
    req.query.desde,
    req.query.hasta,
  ));
});

const getCashSummary = asyncHandler(async (req, res) => {
  res.json(await operationsService.getCashSummary(req.user));
});

const closeCash = asyncHandler(async (req, res) => {
  res.status(201).json(await operationsService.closeCash(
    req.user,
    validateCashClose(req.body),
  ));
});

module.exports = {
  addStayCharge,
  changeStock,
  checkIn,
  closeCash,
  checkout,
  createLocation,
  createProduct,
  createSale,
  getRevenue,
  getCashSummary,
  listActiveStays,
  listLocations,
  listMovements,
  listProducts,
  transferStock,
  updateProduct,
};
