const {
  requireEmail,
  requireObject,
  requirePassword,
} = require('../../lib/validation');
const { asyncHandler } = require('../../lib/asyncHandler');
const authService = require('./auth.service');

const login = asyncHandler(async (req, res) => {
  requireObject(req.body);
  const correo = requireEmail(req.body.correo);
  const password = requirePassword(req.body.password, { min: 1 });

  const result = await authService.login(correo, password);
  res.status(200).json(result);
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user, req.auth.sessionId);
  res.status(204).end();
});

const me = asyncHandler(async (req, res) => {
  res.json({
    id: req.user.id,
    establecimiento_id: req.user.establecimiento_id,
    nombres: req.user.nombres,
    apellidos: req.user.apellidos,
    correo: req.user.correo,
    telefono: req.user.telefono,
    roles: req.user.roles,
  });
});

module.exports = { login, logout, me };
