const { calendarService } = require('./services');
const { response } = require('../common/response');
const { createError } = require('../middleware/errorHandler');

module.exports.calendarController = {
  listar: async (req, res, next) => {
    try {
      const { desde, hasta, tipo, departamentoId } = req.query;

      const eventos = await calendarService.listar({
        desde,
        hasta,
        tipo,
        departamentoId,
      });

      response.success(res, 'Eventos obtenidos exitosamente', 200, eventos);
    } catch (error) {
      next(error);
    }
  },

  proximos: async (req, res, next) => {
    try {
      const eventos = await calendarService.proximos(req.query.limite);

      response.success(
        res,
        'Próximos eventos obtenidos exitosamente',
        200,
        eventos
      );
    } catch (error) {
      next(error);
    }
  },

  obtener: async (req, res, next) => {
    try {
      const evento = await calendarService.obtener(req.params.id);

      if (!evento) {
        throw createError('Evento no encontrado', 404);
      }

      response.success(res, 'Evento obtenido exitosamente', 200, evento);
    } catch (error) {
      next(error);
    }
  },

  crear: async (req, res, next) => {
    try {
      const evento = await calendarService.crear(req.user.id, req.body);

      response.success(res, 'Evento creado exitosamente', 201, evento);
    } catch (error) {
      next(error);
    }
  },

  actualizar: async (req, res, next) => {
    try {
      const evento = await calendarService.actualizar(
        req.params.id,
        req.user,
        req.body
      );

      if (!evento) {
        throw createError('Evento no encontrado', 404);
      }

      response.success(res, 'Evento actualizado exitosamente', 200, evento);
    } catch (error) {
      next(error);
    }
  },

  eliminar: async (req, res, next) => {
    try {
      const eliminado = await calendarService.eliminar(req.params.id, req.user);

      if (!eliminado) {
        throw createError('Evento no encontrado', 404);
      }

      response.success(res, 'Evento eliminado exitosamente', 200);
    } catch (error) {
      next(error);
    }
  },
};
