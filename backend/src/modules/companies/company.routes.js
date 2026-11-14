const { Router } = require('express');
const { authenticate } = require('../../middlewares/authenticate');
const { requireRole } = require('../../middlewares/requireRole');
const controller = require('./company.controller');

const router = Router();

router.use(authenticate);
router.get('/', controller.getMine);
router.put('/', requireRole('administrador'), controller.updateMine);

module.exports = router;
