const { configuracionService } = require('./services');
const { createError } = require('../middleware/errorHandler');
const { response } = require('../common/response');

module.exports.configuracionController = {
  updateParametrizacionPlataforma: async (req, res) => {
    try {
      let id = 0
      const updateData = req.body;

      if (req.params[0] == null) {
        id = 1
      } else {
        id = req.params.id;
      }

      if (!updateData || Object.keys(updateData).length === 0) {
        throw createError('Datos de actualización son requeridos', 400);
      }


      const updateParametrizacionPlataforma =
        await configuracionService.updateParametrizacionPlataforma(
          id,
          updateData
        );

      if (!updateParametrizacionPlataforma) {
        throw createError('Formulario base no encontrado', 404);
      }
      response.success(
        res,
        'Formulario actualizado correctamente ',
        200,
        updateParametrizacionPlataforma
      );
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  },

  getParametrizacionPlataforma: async (req, res, next) => {

    try {
      const { id } = req.params;
      if (!id) {
        throw createError('ID del formulario requerido', 400);
      }

      const Parametrizacion = await configuracionService.getParametrizacionPlataforma(id);
      response.success(
        res,
        'Formulario obtenido exitosamente',
        200,
        Parametrizacion
      );

    } catch (error) {
      next(error);

    }

  }
};
