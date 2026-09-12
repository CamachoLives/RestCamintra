const { documentosService } = require('./services');
const { response } = require('../common/response');
const { createError } = require('../middleware/errorHandler');

module.exports.documentosController = {
  listar: async (req, res, next) => {
    try {
      const { q, categoria, etiqueta, borradores, page, limit } = req.query;

      const puedePublicar = ['admin', 'editor'].includes(req.user.rol);

      const resultado = await documentosService.listar({
        q,
        categoria,
        etiqueta,
        incluirBorradores: borradores === 'true' && puedePublicar,
        page,
        limit,
      });

      response.success(res, 'Documentos obtenidos exitosamente', 200, resultado);
    } catch (error) {
      next(error);
    }
  },

  obtener: async (req, res, next) => {
    try {
      const documento = await documentosService.obtenerPorSlug(req.params.slug);

      if (!documento) {
        throw createError('Documento no encontrado', 404);
      }

      response.success(res, 'Documento obtenido exitosamente', 200, documento);
    } catch (error) {
      next(error);
    }
  },

  crear: async (req, res, next) => {
    try {
      const documento = await documentosService.crear(req.user.id, req.body);

      response.success(res, 'Documento creado exitosamente', 201, documento);
    } catch (error) {
      next(error);
    }
  },

  actualizar: async (req, res, next) => {
    try {
      const documento = await documentosService.actualizar(
        req.params.id,
        req.user,
        req.body
      );

      if (!documento) {
        throw createError('Documento no encontrado', 404);
      }

      response.success(
        res,
        'Documento actualizado exitosamente',
        200,
        documento
      );
    } catch (error) {
      next(error);
    }
  },

  eliminar: async (req, res, next) => {
    try {
      const eliminado = await documentosService.eliminar(
        req.params.id,
        req.user
      );

      if (!eliminado) {
        throw createError('Documento no encontrado', 404);
      }

      response.success(res, 'Documento eliminado exitosamente', 200);
    } catch (error) {
      next(error);
    }
  },

  listarCategorias: async (req, res, next) => {
    try {
      const categorias = await documentosService.listarCategorias();

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
