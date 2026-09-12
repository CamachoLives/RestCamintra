const express = require('express');
const { usersController } = require('./controller');
const { authenticateToken, soloAdmin } = require('../middleware/security');
const router = express.Router();

module.exports.Users = app => {
  // Rutas protegidas - solo usuarios autenticados pueden acceder
  router
    .get('/', authenticateToken, usersController.getAllUsers)
    .get('/me', authenticateToken, usersController.getMe)
    .get('/:id', authenticateToken, usersController.getUserById)
    // Cambiar datos o rol de un usuario es cosa de administración
    .put('/:id', authenticateToken, soloAdmin, usersController.updateUser)
    .delete('/:id', authenticateToken, soloAdmin, usersController.deleteUser);

  app.use('/api/users', router);
};
