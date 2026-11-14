const { HttpError } = require('../../lib/httpError');
const publicEstablishmentModel = require('./public-establishment.model');

async function search(query) {
  return publicEstablishmentModel.searchPublic(query);
}

async function getById(establishmentId) {
  const establishment = await publicEstablishmentModel.findPublic(establishmentId);
  if (!establishment) {
    throw new HttpError(404, 'No se encontró un establecimiento público.');
  }
  const rooms = await publicEstablishmentModel.findAvailableRooms(establishmentId);
  return { ...establishment, habitaciones_disponibles: rooms };
}

module.exports = { getById, search };
