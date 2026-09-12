const { dashboardService } = require('./services');
const { response } = require('../common/response');

module.exports.dashboardController = {
  resumen: async (req, res, next) => {
    try {
      const datos = await dashboardService.resumen(req.user.id);

      response.success(res, 'Resumen obtenido exitosamente', 200, datos);
    } catch (error) {
      next(error);
    }
  },

  indicadores: async (req, res, next) => {
    try {
      const datos = await dashboardService.indicadores(req.user.id);

      response.success(res, 'Indicadores obtenidos exitosamente', 200, datos);
    } catch (error) {
      next(error);
    }
  },
};
