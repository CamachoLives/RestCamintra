const express = require('express');
const { configuracionController } = require('./controller');
const { authenticateToken } = require('../middleware/security');
const router = express.Router();

module.exports.configuracion = app => {
  router
  .put('/:id',authenticateToken,configuracionController.updateParametrizacionPlataforma)
  .get('/:id',authenticateToken,configuracionController.getParametrizacionPlataforma);
  app.use('/configuracion', router);
};
