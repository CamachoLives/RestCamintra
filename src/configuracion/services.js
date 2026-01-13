const { configuracionRepository } = require('./repository');
const { createError } = require('../middleware/errorHandler');

const updateParametrizacionPlataforma = async (id, updateData) => {
  try {
    if (!id) {
      throw createError('ID del formulario requerido', 400);
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      throw createError('Datos de actualización requeridos', 400);
    }
    const updateParametrizacionPlataforma =
      await configuracionRepository.updateParametrizacionPlataforma(
        id,
        updateData
      );
    if (!updateParametrizacionPlataforma) {
      return null;
    }

    return updateParametrizacionPlataforma;
  } catch (error) {
    if (error.isOperational) {
      throw error;
    }
    throw createError('Error al actualizar el formulario', 500);
  }
};

const getParametrizacionPlataforma = async (id) => {
  try {
    if (!id) {

      const getParametrizacionPlataforma =
      await configuracionRepository.getParametrizacionPlataforma(id);
    if (!getParametrizacionPlataforma) {
      return null;
    }

    return getParametrizacionPlataforma;
    }
  } catch (error) {
    throw new Error("Error al obtener el formulario de parametros!", 400);
    
  }
}

module.exports.configuracionService = {
  updateParametrizacionPlataforma,
  getParametrizacionPlataforma
};
