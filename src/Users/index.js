const express = require('express');
const { usersController } = require('./controller');
const { authenticateToken, soloAdmin } = require('../middleware/security');
const router = express.Router();

module.exports.Users = app => {
  router
    // El listado completo trae el correo de toda la empresa: para eso
    // esta /api/directorio, que es el que puede ver cualquiera. Aqui solo
    // entra administracion.
    .get('/', authenticateToken, soloAdmin, usersController.getAllUsers)
    .get('/me', authenticateToken, usersController.getMe)
    .get('/:id', authenticateToken, usersController.getUserById)
    // Cambiar datos o rol de un usuario es cosa de administración
    .put('/:id', authenticateToken, soloAdmin, usersController.updateUser)
    .delete('/:id', authenticateToken, soloAdmin, usersController.deleteUser);

  app.use('/api/users', router);
};
