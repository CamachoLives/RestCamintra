const express = require('express');
const { comunicadosController } = require('./controller');
const { authenticateToken, adminOEditor } = require('../middleware/security');
const router = express.Router();

module.exports.Comunicados = app => {
  // /categorias antes de /:id para que no se lo coma el parámetro
  router
    .get(
      '/categorias',
      authenticateToken,
      comunicadosController.listarCategorias
    )
    .get('/', authenticateToken, comunicadosController.listar)
    .get('/:id', authenticateToken, comunicadosController.obtener)
    .post('/:id/leido', authenticateToken, comunicadosController.marcarLeido)
    .post('/', authenticateToken, adminOEditor, comunicadosController.crear)
    .put(
      '/:id',
      authenticateToken,
      adminOEditor,
      comunicadosController.actualizar
    )
    .delete(
      '/:id',
      authenticateToken,
      adminOEditor,
      comunicadosController.eliminar
    );

  app.use('/api/comunicados', router);
};
