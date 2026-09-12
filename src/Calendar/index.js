const express = require('express');
const { calendarController } = require('./controller');
const { authenticateToken, adminOEditor } = require('../middleware/security');
const router = express.Router();

module.exports.Calendar = app => {
  // /proximos antes de /:id para que no lo tome como parámetro
  router
    .get('/proximos', authenticateToken, calendarController.proximos)
    .get('/', authenticateToken, calendarController.listar)
    .get('/:id', authenticateToken, calendarController.obtener)
    .post('/', authenticateToken, adminOEditor, calendarController.crear)
    .put('/:id', authenticateToken, adminOEditor, calendarController.actualizar)
    .delete(
      '/:id',
      authenticateToken,
      adminOEditor,
      calendarController.eliminar
    );

  app.use('/api/eventos', router);
};
