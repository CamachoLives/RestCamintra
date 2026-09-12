const express = require('express');
const { notificationsController } = require('./controller');
const { authenticateToken } = require('../middleware/security');
const router = express.Router();

module.exports.Notifications = app => {
  router
    .get('/', authenticateToken, notificationsController.listar)
    .post(
      '/leer-todas',
      authenticateToken,
      notificationsController.marcarTodasLeidas
    )
    .post('/:id/leida', authenticateToken, notificationsController.marcarLeida);

  app.use('/api/notificaciones', router);
};
