const express = require('express');
const { usersController } = require('./controller');
const { authenticateToken } = require('../middleware/security');
const router = express.Router();

module.exports.Users = app => {
  // Rutas protegidas - solo usuarios autenticados pueden acceder
  router
    .get('/', authenticateToken, usersController.getAllUsers)
    .get('/:id', authenticateToken, usersController.getUserById)
    .put('/:id', authenticateToken, usersController.updateUser)
    .delete('/:id', authenticateToken, usersController.deleteUser);

  app.use('/api/users', router);
};
