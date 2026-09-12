const { comunicadosService } = require('./services');
const { response } = require('../common/response');
const { createError } = require('../middleware/errorHandler');

module.exports.comunicadosController = {
  listar: async (req, res, next) => {
    try {
      const { q, categoriaId, prioridad, noLeidos, borradores, page, limit } =
        req.query;

      // Los borradores solo los ve quien puede publicar
      const puedePublicar = ['admin', 'editor'].includes(req.user.rol);

      const resultado = await comunicadosService.listar(req.user.id, {
        q,
        categoriaId,
        prioridad,
        soloNoLeidos: noLeidos === 'true',
        incluirBorradores: borradores === 'true' && puedePublicar,
        page,
        limit,
      });

      response.success(
        res,
        'Comunicados obtenidos exitosamente',
        200,
        resultado
      );
    } catch (error) {
      next(error);
    }
  },

  obtener: async (req, res, next) => {
    try {
      const comunicado = await comunicadosService.obtener(
        req.params.id,
        req.user.id
      );

      if (!comunicado) {
        throw createError('Comunicado no encontrado', 404);
      }

      response.success(res, 'Comunicado obtenido exitosamente', 200, comunicado);
    } catch (error) {
      next(error);
    }
  },

  crear: async (req, res, next) => {
    try {
      const comunicado = await comunicadosService.crear(req.user.id, req.body);

      response.success(res, 'Comunicado creado exitosamente', 201, comunicado);
    } catch (error) {
      next(error);
    }
  },

  actualizar: async (req, res, next) => {
    try {
      const comunicado = await comunicadosService.actualizar(
        req.params.id,
        req.user,
        req.body
      );

      if (!comunicado) {
        throw createError('Comunicado no encontrado', 404);
      }

      response.success(
        res,
        'Comunicado actualizado exitosamente',
        200,
        comunicado
      );
    } catch (error) {
      next(error);
    }
  },

  eliminar: async (req, res, next) => {
    try {
      const eliminado = await comunicadosService.eliminar(
        req.params.id,
        req.user
      );

      if (!eliminado) {
        throw createError('Comunicado no encontrado', 404);
      }

      response.success(res, 'Comunicado eliminado exitosamente', 200);
    } catch (error) {
      next(error);
    }
  },

  marcarLeido: async (req, res, next) => {
    try {
      const resultado = await comunicadosService.marcarLeido(
        req.params.id,
        req.user.id
      );

      response.success(res, 'Comunicado marcado como leído', 200, resultado);
    } catch (error) {
      next(error);
    }
  },

  listarCategorias: async (req, res, next) => {
    try {
      const categorias = await comunicadosService.listarCategorias();

      response.success(
        res,
        'Categorías obtenidas exitosamente',
        200,
        categorias
      );
    } catch (error) {
      next(error);
    }
  },
};
