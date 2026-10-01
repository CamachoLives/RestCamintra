const express = require('express');
const { configuracionController } = require('./controller');
const { authenticateToken, soloAdmin } = require('../middleware/security');
const router = express.Router();

/**
 * Parametrización de la plataforma.
 *
 * Se monta en /api/parametrizacion como el resto de los módulos; antes
 * colgaba de /parametrizacion y era el único endpoint fuera de /api, así
 * que el front tenía que apuntarle con una URL absoluta a mano.
 */
module.exports.configuracion = app => {
  router
    .get('/plataforma', authenticateToken, configuracionController.obtener)
    // Cambiar los ajustes globales es cosa de administración
    .post(
      '/plataforma',
      authenticateToken,
      soloAdmin,
      configuracionController.actualizar
    );

  app.use('/api/parametrizacion', router);
};
