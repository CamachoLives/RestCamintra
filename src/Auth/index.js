const express = require('express');
const { AuthController } = require('./controller');
const { authSchemas, validateRequest } = require('../middleware/validation');
const { authRateLimit, authenticateToken } = require('../middleware/security');
const router = express.Router();

module.exports.Auth = app => {
  router
    // El rate limit y la validación estaban comentados: /login quedaba
    // abierto a fuerza bruta y aceptaba cualquier cuerpo, incluso vacío.
    .post(
      '/login',
      authRateLimit,
      validateRequest(authSchemas.login),
      AuthController.Login
    )
    .post(
      '/register',
      authRateLimit,
      validateRequest(authSchemas.register),
      AuthController.Register
    )
    .get('/verify', authenticateToken, AuthController.VerifyToken);

  app.use('/api/auth', router);
};
