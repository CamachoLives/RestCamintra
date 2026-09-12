const { directorioRepository } = require('./repository');
const { createError } = require('../middleware/errorHandler');
const { PAGINATION } = require('../constants/index');
const debug = require('debug')('app:directorio-service');

const listar = async (opciones = {}) => {
  try {
    const page = Math.max(parseInt(opciones.page) || PAGINATION.DEFAULT_PAGE, 1);
    const limit = Math.min(
      parseInt(opciones.limit) || 20,
      PAGINATION.MAX_LIMIT
    );

    const [items, total] = await Promise.all([
      directorioRepository.listar({ ...opciones, page, limit }),
      directorioRepository.contar(opciones),
    ]);

    debug(`Directorio: ${items.length} de ${total}`);

    return {
      items,
      total,
      page,
      limit,
      totalPaginas: Math.ceil(total / limit) || 1,
    };
  } catch (error) {
    debug('Error listando el directorio:', error);
    throw createError('Error al obtener el directorio', 500);
  }
};

const obtener = async usuarioId => {
  try {
    if (!usuarioId) {
      throw createError('ID de usuario requerido', 400);
    }

    return await directorioRepository.obtenerPorUsuario(usuarioId);
  } catch (error) {
    if (error.isOperational) throw error;
    debug('Error obteniendo la ficha:', error);
    throw createError('Error al obtener la ficha del colaborador', 500);
  }
};

const guardarFicha = async (usuarioId, datos) => {
  try {
    if (!usuarioId) {
      throw createError('ID de usuario requerido', 400);
    }

    if (!datos || Object.keys(datos).length === 0) {
      throw createError('Datos de la ficha requeridos', 400);
    }

    if (Number(datos.jefe_id) === Number(usuarioId)) {
      throw createError('Un colaborador no puede ser su propio jefe', 400);
    }

    return await directorioRepository.guardarFicha(usuarioId, datos);
  } catch (error) {
    if (error.isOperational) throw error;

    // Violación de llave foránea: departamento o jefe inexistente
    if (error.code === '23503') {
      throw createError('El departamento o el jefe indicado no existe', 400);
    }

    debug('Error guardando la ficha:', error);
    throw createError('Error al guardar la ficha del colaborador', 500);
  }
};

const listarDepartamentos = async () => {
  try {
    return await directorioRepository.listarDepartamentos();
  } catch (error) {
    debug('Error listando departamentos:', error);
    throw createError('Error al obtener los departamentos', 500);
  }
};

const crearDepartamento = async datos => {
  try {
    if (!datos.nombre || !datos.nombre.trim()) {
      throw createError('El nombre del departamento es requerido', 400);
    }

    return await directorioRepository.crearDepartamento({
      ...datos,
      nombre: datos.nombre.trim(),
    });
  } catch (error) {
    if (error.isOperational) throw error;

    // Nombre duplicado
    if (error.code === '23505') {
      throw createError('Ya existe un departamento con ese nombre', 409);
    }

    debug('Error creando el departamento:', error);
    throw createError('Error al crear el departamento', 500);
  }
};

module.exports.directorioService = {
  listar,
  obtener,
  guardarFicha,
  listarDepartamentos,
  crearDepartamento,
};
