const { Router } = require('express');
const controller = require('./public-establishment.controller');

const router = Router();

router.get('/establecimientos', controller.search);
router.get('/establecimientos/:id', controller.getById);

module.exports = router;
