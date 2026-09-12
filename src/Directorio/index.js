const express = require('express');
const { directorioController } = require('./controller');
const { authenticateToken, soloAdmin } = require('../middleware/security');
const router = express.Router();

module.exports.Directorio = app => {
  // Ojo con el orden: /departamentos debe ir antes de /:usuarioId
  router
    .get('/departamentos', authenticateToken, directorioController.listarDepartamentos)
    .post('/departamentos', authenticateToken, soloAdmin, directorioController.crearDepartamento)
    .get('/', authenticateToken, directorioController.listar)
    .get('/:usuarioId', authenticateToken, directorioController.obtener)
    .put('/:usuarioId', authenticateToken, directorioController.guardarFicha);

  app.use('/api/directorio', router);
};
