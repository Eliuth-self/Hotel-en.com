const { withTransaction } = require('../../database/transaction');
const { HttpError } = require('../../lib/httpError');
const { recordAudit } = require('../../lib/audit');
const establishmentModel = require('./establishment.model');

async function getMine(user) {
  const establishment = await establishmentModel.findById(user.establecimiento_id);
  if (!establishment) {
    throw new HttpError(404, 'No se encontró el establecimiento.');
  }
  return establishment;
}

async function updateMine(user, values) {
  return withTransaction(async (client) => {
    const currentMunicipalityId = await establishmentModel.findMunicipalityId(
      client,
      user.establecimiento_id,
    );
    if (currentMunicipalityId === undefined) {
      throw new HttpError(404, 'No se encontró el establecimiento.');
    }
    const targetMunicipalityId = Object.hasOwn(values, 'municipio_id')
      ? values.municipio_id
      : currentMunicipalityId;

    if (values.division_territorial_id) {
      if (!targetMunicipalityId) {
        throw new HttpError(400, 'Selecciona un municipio para asignar una división territorial.');
      }
      const belongs = await establishmentModel.divisionBelongsToMunicipality(
        client,
        values.division_territorial_id,
        targetMunicipalityId,
      );
      if (!belongs) {
        throw new HttpError(400, 'La división territorial no pertenece al municipio seleccionado.');
      }
    }

    const establishment = await establishmentModel.updateById(
      client,
      user.establecimiento_id,
      values,
    );
    if (!establishment) {
      throw new HttpError(404, 'No se encontró el establecimiento.');
    }

    await recordAudit(client, {
      establishmentId: user.establecimiento_id,
      userId: user.id,
      action: 'establecimiento_actualizado',
      entity: 'establecimientos',
      recordId: user.establecimiento_id,
      details: { fields: Object.keys(values) },
    });
    return establishment;
  });
}

module.exports = { getMine, updateMine };
