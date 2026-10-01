const { configuracionService } = require('./services');
const { response } = require('../common/response');
const { createError } = require('../middleware/errorHandler');

module.exports.configuracionController = {
  obtener: async (req, res, next) => {
    try {
      const parametrizacion = await configuracionService.obtener();

      if (!parametrizacion) {
        throw createError('La plataforma no está parametrizada todavía', 404);
      }

      response.success(
        res,
        'Parametrización obtenida exitosamente',
        200,
        parametrizacion
      );
    } catch (error) {
      next(error);
    }
  },

  actualizar: async (req, res, next) => {
    try {
      const parametrizacion = await configuracionService.actualizar(req.body);

      response.success(
        res,
        'Parametrización actualizada correctamente',
        200,
        parametrizacion
      );
    } catch (error) {
      // Antes este catch respondía 404 a cualquier fallo -- validación,
      // permisos, caída de la base -- y nunca llegaba al errorHandler.
      next(error);
    }
  },
};
