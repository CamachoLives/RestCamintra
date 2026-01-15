const express = require('express');
const { configuracionController } = require('./controller');
const { authenticateToken } = require('../middleware/security');
const router = express.Router();

module.exports.configuracion = app => {
  router
  .post('/plataforma',authenticateToken,configuracionController.updateParametrizacionPlataforma)
  .get('/:id',authenticateToken,configuracionController.getParametrizacionPlataforma);
  app.use('/parametrizacion', router);
  app.use(express.json());
};
