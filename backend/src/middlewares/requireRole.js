const { HttpError } = require('../lib/httpError');

function requireRole(...allowedRoles) {
  return function checkRole(req, res, next) {
    if (!req.user || !allowedRoles.some((role) => req.user.roles.includes(role))) {
      return next(new HttpError(403, 'No tienes permisos para realizar esta operación.'));
    }
    return next();
  };
}

module.exports = { requireRole };
