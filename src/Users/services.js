const { UsersRepository } = require('./repository');
const { createError } = require('../middleware/errorHandler');
const { PAGINATION } = require('../constants/index');
const debug = require('debug')('app:users-service');

/**
 * Listado paginado de usuarios.
 *
 * Antes devolvia un array pelado: el panel de administracion recibia 10
 * filas y no tenia forma de saber si habia 11 o 11.000, asi que no podia
 * pintar la paginacion. Ahora responde el mismo sobre que el resto de los
 * listados de la API.
 */
const getAllUsers = async (options = {}) => {
  try {
    const { email, rol } = options;
    const page = Math.max(parseInt(options.page) || PAGINATION.DEFAULT_PAGE, 1);
    const limit = Math.min(
      parseInt(options.limit) || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT
    );

    const [items, total] = await Promise.all([
      UsersRepository.getAllUsers({ email, rol, page, limit }),
      UsersRepository.contarUsuarios({ email, rol }),
    ]);

    debug(`Retrieved ${items.length} of ${total} users`);

    return {
      items,
      total,
      page,
      limit,
      totalPaginas: Math.ceil(total / limit) || 1,
    };
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

    const updatedUser = await UsersRepository.updateUser(id, updateData);

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
