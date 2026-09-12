const { directorioService } = require('./services');
const { response } = require('../common/response');
const { createError } = require('../middleware/errorHandler');

module.exports.directorioController = {
  listar: async (req, res, next) => {
    try {
      const { q, departamentoId, page, limit } = req.query;

      const resultado = await directorioService.listar({
        q,
        departamentoId,
        page,
        limit,
      });

      response.success(res, 'Directorio obtenido exitosamente', 200, resultado);
    } catch (error) {
      next(error);
    }
  },

  obtener: async (req, res, next) => {
    try {
      const { usuarioId } = req.params;
      const ficha = await directorioService.obtener(usuarioId);

      if (!ficha) {
        throw createError('Colaborador no encontrado', 404);
      }

      response.success(res, 'Colaborador obtenido exitosamente', 200, ficha);
    } catch (error) {
      next(error);
    }
  },

  guardarFicha: async (req, res, next) => {
    try {
      const { usuarioId } = req.params;

      // Un colaborador puede editar su propia ficha; el resto, solo admin
      const esPropia = Number(req.user.id) === Number(usuarioId);
      if (!esPropia && req.user.rol !== 'admin') {
        throw createError('Solo puedes editar tu propia ficha', 403);
      }

      const ficha = await directorioService.guardarFicha(usuarioId, req.body);

      response.success(res, 'Ficha guardada exitosamente', 200, ficha);
    } catch (error) {
      next(error);
    }
  },

  listarDepartamentos: async (req, res, next) => {
    try {
      const departamentos = await directorioService.listarDepartamentos();

      response.success(
        res,
        'Departamentos obtenidos exitosamente',
        200,
        departamentos
      );
    } catch (error) {
      next(error);
    }
  },

  crearDepartamento: async (req, res, next) => {
    try {
      const departamento = await directorioService.crearDepartamento(req.body);

      response.success(res, 'Departamento creado exitosamente', 201, departamento);
    } catch (error) {
      next(error);
    }
  },
};
