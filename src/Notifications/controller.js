const { notificationsService } = require('./services');
const { response } = require('../common/response');

module.exports.notificationsController = {
  listar: async (req, res, next) => {
    try {
      const resultado = await notificationsService.listar(req.user.id, {
        soloNoLeidas: req.query.noLeidas === 'true',
        limite: req.query.limite,
      });

      response.success(
        res,
        'Notificaciones obtenidas exitosamente',
        200,
        resultado
      );
    } catch (error) {
      next(error);
    }
  },

  marcarLeida: async (req, res, next) => {
    try {
      const resultado = await notificationsService.marcarLeida(
        req.params.id,
        req.user.id
      );

      response.success(res, 'Notificación marcada como leída', 200, resultado);
    } catch (error) {
      next(error);
    }
  },

  marcarTodasLeidas: async (req, res, next) => {
    try {
      const resultado = await notificationsService.marcarTodasLeidas(
        req.user.id
      );

      response.success(
        res,
        'Notificaciones marcadas como leídas',
        200,
        resultado
      );
    } catch (error) {
      next(error);
    }
  },
};
