const { UsersRepository } = require('./repository');
const { createError } = require('../middleware/errorHandler');
const debug = require('debug')('app:users-service');

const getAllUsers = async (options = {}) => {
  try {
    const { email, page = 1, limit = 10 } = options;

    const users = await UsersRepository.getAllUsers({
      email,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    debug(`Retrieved ${users.length} users`);
    return users;
  } catch (error) {
    debug('Error getting all users:', error);
    throw createError('Error al obtener los usuarios', 500);
  }
};

const getUserById = async id => {
  try {
    if (!id) {
      throw createError('ID de usuario requerido', 400);
    }

    const user = await UsersRepository.getUserById(id);

    if (!user) {
      return null;
    }
    debug(`Retrieved user with ID: ${id}`);
    return user;
  } catch (error) {
    debug('Error getting user by ID:', error);
    if (error.isOperational) {
      throw error;
    }
    throw createError('Error al obtener el usuario', 500);
  }
};

const updateUser = async (id, updateData) => {
  try {
    if (!id) {
      throw createError('ID de usuario requerido', 400);
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      throw createError('Datos de actualización requeridos', 400);
    }

    const updatedUser = await UsersRepository.updateUser(id, {
      ...updateData,
      updatedAt: new Date(),
    });

    if (!updatedUser) {
      return null;
    }

    debug(`Updated user with ID: ${id}`);
    return updatedUser;
  } catch (error) {
    debug('Error updating user:', error);
    if (error.isOperational) {
      throw error;
    }
    throw createError('Error al actualizar el usuario', 500);
  }
};

const deleteUser = async id => {
  try {
    if (!id) {
      throw createError('ID de usuario requerido', 400);
    }

    const deleted = await UsersRepository.deleteUser(id);

    if (!deleted) {
      return false;
    }

    debug(`Deleted user with ID: ${id}`);
    return true;
  } catch (error) {
    debug('Error deleting user:', error);
    if (error.isOperational) {
      throw error;
    }
    throw createError('Error al eliminar el usuario', 500);
  }
};

module.exports.usersService = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
