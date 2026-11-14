const { Router } = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const onboardingRoutes = require('../modules/onboarding/onboarding.routes');
const companyRoutes = require('../modules/companies/company.routes');
const establishmentRoutes = require('../modules/establishments/establishment.routes');
const userRoutes = require('../modules/users/user.routes');
const roleRoutes = require('../modules/roles/role.routes');
const roomRoutes = require('../modules/rooms/room.routes');
const operationsRoutes = require('../modules/operations/operations.routes');
const publicEstablishmentRoutes = require('../modules/public-establishments/public-establishment.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/public', publicEstablishmentRoutes);
router.use('/empresa', companyRoutes);
router.use('/establecimiento', establishmentRoutes);
router.use('/usuarios', userRoutes);
router.use('/roles', roleRoutes);
router.use('/habitaciones', roomRoutes);
router.use('/operaciones', operationsRoutes);

module.exports = router;
