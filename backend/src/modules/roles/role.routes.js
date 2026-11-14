const { Router } = require('express');
const { authenticate } = require('../../middlewares/authenticate');
const { requireRole } = require('../../middlewares/requireRole');
const controller = require('./role.controller');

const router = Router();

router.use(authenticate, requireRole('administrador'));
router.get('/', controller.list);

module.exports = router;
