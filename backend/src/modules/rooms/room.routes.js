const { Router } = require('express');
const { authenticate } = require('../../middlewares/authenticate');
const { requireRole } = require('../../middlewares/requireRole');
const controller = require('./room.controller');

const router = Router();

router.use(authenticate);
router.get('/resumen', controller.getSummary);
router.get('/grupos', controller.listGroups);
router.post('/grupos', requireRole('administrador'), controller.createGroup);
router.put('/grupos/:id', requireRole('administrador'), controller.updateGroup);
router.delete('/grupos/:id', requireRole('administrador'), controller.deleteGroup);
router.post(
  '/grupos/:id/habitaciones',
  requireRole('administrador'),
  controller.createFromGroup,
);
router.get('/', controller.list);
router.post('/', requireRole('administrador'), controller.create);
router.get('/:id', controller.getById);
router.put('/:id', requireRole('administrador'), controller.update);
router.delete('/:id', requireRole('administrador'), controller.remove);

module.exports = router;
