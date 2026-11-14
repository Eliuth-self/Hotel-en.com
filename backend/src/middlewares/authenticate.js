const jwt = require('jsonwebtoken');
const { HttpError } = require('../lib/httpError');
const authModel = require('../modules/auth/auth.model');

async function authenticate(req, res, next) {
  const authorization = req.get('authorization');
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return next(new HttpError(401, 'Debes iniciar sesión para continuar.'));
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return next(new Error('JWT_SECRET is required to authenticate requests.'));
  }

  let claims;
  try {
    claims = jwt.verify(authorization.slice(7), secret);
  } catch {
    return next(new HttpError(401, 'La sesión no es válida o ha expirado.'));
  }

  if (typeof claims !== 'object' || !claims.sub || !claims.jti) {
    return next(new HttpError(401, 'La sesión no es válida o ha expirado.'));
  }

  try {
    const user = await authModel.findActiveSession(claims.jti, claims.sub);
    if (!user) {
      return next(new HttpError(401, 'La sesión ya no está activa.'));
    }

    req.user = user;
    req.auth = { sessionId: claims.jti };
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { authenticate };
