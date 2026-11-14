const { asyncHandler } = require('../../lib/asyncHandler');
const { validateOnboarding } = require('./onboarding.validation');
const onboardingService = require('./onboarding.service');

const create = asyncHandler(async (req, res) => {
  const data = validateOnboarding(req.body);
  const result = await onboardingService.create(data);
  res.status(201).json(result);
});

module.exports = { create };
