const bcrypt = require('bcryptjs');
const { withTransaction } = require('../../database/transaction');
const { recordAudit } = require('../../lib/audit');
const { createSession } = require('../auth/auth.service');
const onboardingModel = require('./onboarding.model');

async function create({ company, establishment, administrator }) {
  const passwordHash = await bcrypt.hash(administrator.password, 12);

  return withTransaction(async (client) => {
    const createdCompany = await onboardingModel.createCompany(client, company);
    const createdEstablishment = await onboardingModel.createEstablishment(
      client,
      createdCompany.id,
      establishment,
    );
    const createdUser = await onboardingModel.createAdministrator(
      client,
      createdEstablishment.id,
      administrator,
      passwordHash,
    );
    await onboardingModel.assignAdministratorRole(client, createdUser.id);

    await recordAudit(client, {
      establishmentId: createdEstablishment.id,
      userId: createdUser.id,
      action: 'empresa_creada',
      entity: 'empresas',
      recordId: createdCompany.id,
    });

    const session = await createSession(
      client,
      createdUser,
      ['administrador'],
      'registro_inicial',
    );

    return {
      empresa: createdCompany,
      establecimiento: createdEstablishment,
      ...session,
    };
  });
}

module.exports = { create };
