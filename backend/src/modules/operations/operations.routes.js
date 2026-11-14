const { Router } = require('express');
const { authenticate } = require('../../middlewares/authenticate');
const { requireRole } = require('../../middlewares/requireRole');
const controller = require('./operations.controller');

const router = Router();
const inventoryManagers = requireRole('administrador', 'inventario');
const frontDesk = requireRole('administrador', 'recepcionista', 'cajero');
const salesStaff = requireRole('administrador', 'recepcionista', 'cajero', 'inventario');
const operationsReaders = requireRole(
  'administrador',
  'recepcionista',
  'cajero',
  'inventario',
  'supervisor',
);
const cashHandlers = requireRole('administrador', 'recepcionista', 'cajero', 'inventario');

router.use(authenticate);
router.get('/productos', operationsReaders, controller.listProducts);
router.post('/productos', inventoryManagers, controller.createProduct);
router.put('/productos/:id', inventoryManagers, controller.updateProduct);
router.get('/ubicaciones', operationsReaders, controller.listLocations);
router.post('/ubicaciones', inventoryManagers, controller.createLocation);
router.get('/movimientos', operationsReaders, controller.listMovements);
router.post('/movimientos', inventoryManagers, controller.changeStock);
router.post('/traslados', inventoryManagers, controller.transferStock);
router.get('/estadias', operationsReaders, controller.listActiveStays);
router.post('/estadias', frontDesk, controller.checkIn);
router.post('/estadias/:id/cargos', salesStaff, controller.addStayCharge);
router.post('/estadias/:id/cierre', frontDesk, controller.checkout);
router.post('/ventas', salesStaff, controller.createSale);
router.get('/ingresos', operationsReaders, controller.getRevenue);
router.get('/caja/actual', operationsReaders, controller.getCashSummary);
router.post('/caja/cierre', cashHandlers, controller.closeCash);

module.exports = router;
