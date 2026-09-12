const express = require('express');
const { documentosController } = require('./controller');
const { authenticateToken, adminOEditor } = require('../middleware/security');
const router = express.Router();

module.exports.Documentos = app => {
  // El detalle va por slug, que es lo que se ve en la URL de la wiki
  router
    .get('/categorias', authenticateToken, documentosController.listarCategorias)
    .get('/', authenticateToken, documentosController.listar)
    .get('/:slug', authenticateToken, documentosController.obtener)
    .post('/', authenticateToken, adminOEditor, documentosController.crear)
    .put(
      '/:id',
      authenticateToken,
      adminOEditor,
      documentosController.actualizar
    )
    .delete(
      '/:id',
      authenticateToken,
      adminOEditor,
      documentosController.eliminar
    );

  app.use('/api/documentos', router);
};
