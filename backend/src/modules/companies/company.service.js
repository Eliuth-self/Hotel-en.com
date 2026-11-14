const { withTransaction } = require('../../database/transaction');
const { HttpError } = require('../../lib/httpError');
const { recordAudit } = require('../../lib/audit');
const companyModel = require('./company.model');

async function getMine(user) {
  const company = await companyModel.findById(user.empresa_id);
  if (!company) {
    throw new HttpError(404, 'No se encontró la empresa.');
  }
  return company;
}

async function updateMine(user, values) {
  return withTransaction(async (client) => {
    const company = await companyModel.updateById(client, user.empresa_id, values);
    if (!company) {
      throw new HttpError(404, 'No se encontró la empresa.');
    }

    await recordAudit(client, {
      establishmentId: user.establecimiento_id,
      userId: user.id,
      action: 'empresa_actualizada',
      entity: 'empresas',
      recordId: user.empresa_id,
      details: { fields: Object.keys(values) },
    });
    return company;
  });
}

module.exports = { getMine, updateMine };
