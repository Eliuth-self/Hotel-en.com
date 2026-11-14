const { Router } = require('express');
const { authenticate } = require('../../middlewares/authenticate');
const { requireRole } = require('../../middlewares/requireRole');
const controller = require('./user.controller');

const router = Router();

router.use(authenticate, requireRole('administrador'));
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
