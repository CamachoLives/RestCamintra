// const debug = require('debug')('app:users-controller');
const { usersService } = require('./services');
const { response } = require('../common/response');
const { createError } = require('../middleware/errorHandler');

module.exports.usersController = {
  getAllUsers: async (req, res, next) => {
    try {
      const { email, page = 1, limit = 10 } = req.query;

      const users = await usersService.getAllUsers({
        email,
        page: parseInt(page),
        limit: parseInt(limit),
      });

      response.success(res, 'Usuarios obtenidos exitosamente', 200, users);
    } catch (error) {
      next(error);
    }
  },

  getUserById: async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError('ID de usuario requerido', 400);
      }

      const user = await usersService.getUserById(id);

      if (!user) {
        throw createError('Usuario no encontrado', 404);
      }

      // No devolver información sensible
      const { password_hash, ...userWithoutPassword } = user;
      response.success(
        res,
        'Usuario obtenido exitosamente',
        200,
        userWithoutPassword
      );
    } catch (error) {
      next(error);
    }
  },

  updateUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        throw createError('ID de usuario requerido', 400);
      }

      if (!updateData || Object.keys(updateData).length === 0) {
        throw createError('Datos de actualización requeridos', 400);
      }

      // No permitir actualizar password directamente
      if (updateData.password) {
        delete updateData.password;
      }

      const updatedUser = await usersService.updateUser(id, updateData);

      if (!updatedUser) {
        throw createError('Usuario no encontrado', 404);
      }

      // No devolver información sensible
      const { password_hash, ...userWithoutPassword } = updatedUser;
      response.success(
        res,
        'Usuario actualizado exitosamente',
        200,
        userWithoutPassword
      );
    } catch (error) {
      next(error);
    }
  },

  deleteUser: async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError('ID de usuario requerido', 400);
      }

      const deleted = await usersService.deleteUser(id);

      if (!deleted) {
        throw createError('Usuario no encontrado', 404);
      }

      response.success(res, 'Usuario eliminado exitosamente', 200);
    } catch (error) {
      next(error);
    }
  },
};
