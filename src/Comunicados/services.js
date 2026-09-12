const { comunicadosRepository } = require('./repository');
const { createError } = require('../middleware/errorHandler');
const { PAGINATION } = require('../constants/index');
const debug = require('debug')('app:comunicados-service');

const PRIORIDADES = ['baja', 'normal', 'alta', 'urgente'];
const ESTADOS = ['borrador', 'publicado', 'archivado'];

const validarDatos = (datos, { parcial = false } = {}) => {
  if (!parcial) {
    if (!datos.titulo || !datos.titulo.trim()) {
      throw createError('El título del comunicado es requerido', 400);
    }

    if (!datos.contenido || !datos.contenido.trim()) {
      throw createError('El contenido del comunicado es requerido', 400);
    }
  }

  if (datos.prioridad && !PRIORIDADES.includes(datos.prioridad)) {
    throw createError(`Prioridad inválida, use: ${PRIORIDADES.join(', ')}`, 400);
  }

  if (datos.estado && !ESTADOS.includes(datos.estado)) {
    throw createError(`Estado inválido, use: ${ESTADOS.join(', ')}`, 400);
  }

  if (datos.expira_en && Number.isNaN(Date.parse(datos.expira_en))) {
    throw createError('La fecha de expiración no es válida', 400);
  }
};

const listar = async (usuarioId, opciones = {}) => {
  try {
    const page = Math.max(parseInt(opciones.page) || PAGINATION.DEFAULT_PAGE, 1);
    const limit = Math.min(
      parseInt(opciones.limit) || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT
    );

    const filtros = { ...opciones, page, limit };

    const [items, total, noLeidos] = await Promise.all([
      comunicadosRepository.listar(usuarioId, filtros),
      comunicadosRepository.contar(usuarioId, filtros),
      comunicadosRepository.contarNoLeidos(usuarioId),
    ]);

    return {
      items,
      total,
      noLeidos,
      page,
      limit,
      totalPaginas: Math.ceil(total / limit) || 1,
    };
  } catch (error) {
    debug('Error listando comunicados:', error);
    throw createError('Error al obtener los comunicados', 500);
  }
};

const obtener = async (id, usuarioId) => {
  try {
    return await comunicadosRepository.obtener(id, usuarioId);
  } catch (error) {
    debug('Error obteniendo el comunicado:', error);
    throw createError('Error al obtener el comunicado', 500);
  }
};

const crear = async (autorId, datos) => {
  try {
    validarDatos(datos);

    return await comunicadosRepository.crear(autorId, {
      ...datos,
      titulo: datos.titulo.trim(),
    });
  } catch (error) {
    if (error.isOperational) throw error;

    if (error.code === '23503') {
      throw createError('La categoría indicada no existe', 400);
    }

    debug('Error creando el comunicado:', error);
    throw createError('Error al crear el comunicado', 500);
  }
};

const actualizar = async (id, usuario, datos) => {
  try {
    if (!datos || Object.keys(datos).length === 0) {
      throw createError('Datos de actualización requeridos', 400);
    }

    validarDatos(datos, { parcial: true });

    const actual = await comunicadosRepository.obtener(id, usuario.id);
    if (!actual) {
      return null;
    }

    // El editor solo toca lo suyo; el admin, todo
    if (
      usuario.rol !== 'admin' &&
      Number(actual.autor_id) !== Number(usuario.id)
    ) {
      throw createError('Solo puedes editar los comunicados que creaste', 403);
    }

    return await comunicadosRepository.actualizar(id, usuario.id, datos);
  } catch (error) {
    if (error.isOperational) throw error;
    debug('Error actualizando el comunicado:', error);
    throw createError('Error al actualizar el comunicado', 500);
  }
};

const eliminar = async (id, usuario) => {
  try {
    const actual = await comunicadosRepository.obtener(id, usuario.id);
    if (!actual) {
      return false;
    }

    if (
      usuario.rol !== 'admin' &&
      Number(actual.autor_id) !== Number(usuario.id)
    ) {
      throw createError(
        'Solo puedes eliminar los comunicados que creaste',
        403
      );
    }

    return await comunicadosRepository.eliminar(id);
  } catch (error) {
    if (error.isOperational) throw error;
    debug('Error eliminando el comunicado:', error);
    throw createError('Error al eliminar el comunicado', 500);
  }
};

const marcarLeido = async (id, usuarioId) => {
  try {
    const comunicado = await comunicadosRepository.obtener(id, usuarioId);
    if (!comunicado) {
      throw createError('Comunicado no encontrado', 404);
    }

    await comunicadosRepository.marcarLeido(id, usuarioId);

    return { noLeidos: await comunicadosRepository.contarNoLeidos(usuarioId) };
  } catch (error) {
    if (error.isOperational) throw error;
    debug('Error marcando como leído:', error);
    throw createError('Error al marcar el comunicado como leído', 500);
  }
};

const listarCategorias = async () => {
  try {
    return await comunicadosRepository.listarCategorias();
  } catch (error) {
    debug('Error listando categorías:', error);
    throw createError('Error al obtener las categorías', 500);
  }
};

module.exports.comunicadosService = {
  listar,
  obtener,
  crear,
  actualizar,
  eliminar,
  marcarLeido,
  listarCategorias,
};
