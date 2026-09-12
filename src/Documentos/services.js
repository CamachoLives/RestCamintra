const { documentosRepository } = require('./repository');
const { createError } = require('../middleware/errorHandler');
const { PAGINATION } = require('../constants/index');
const debug = require('debug')('app:documentos-service');

const ESTADOS = ['borrador', 'publicado', 'archivado'];

// "Política de Vacaciones 2026" -> "politica-de-vacaciones-2026"
const generarSlug = titulo =>
  titulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);

// Si el slug ya existe le agrega -2, -3, ... hasta encontrar uno libre
const slugDisponible = async titulo => {
  const base = generarSlug(titulo) || 'documento';
  let slug = base;
  let intento = 2;

  while (await documentosRepository.existeSlug(slug)) {
    slug = `${base}-${intento}`;
    intento += 1;
  }

  return slug;
};

const normalizarEtiquetas = etiquetas => {
  if (etiquetas === undefined) return undefined;

  const lista = Array.isArray(etiquetas)
    ? etiquetas
    : String(etiquetas).split(',');

  return lista
    .map(e => String(e).trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 15);
};

const validarDatos = (datos, { parcial = false } = {}) => {
  if (!parcial) {
    if (!datos.titulo || !datos.titulo.trim()) {
      throw createError('El título del documento es requerido', 400);
    }

    if (!datos.contenido || !datos.contenido.trim()) {
      throw createError('El contenido del documento es requerido', 400);
    }
  }

  if (datos.estado && !ESTADOS.includes(datos.estado)) {
    throw createError(`Estado inválido, use: ${ESTADOS.join(', ')}`, 400);
  }
};

const listar = async (opciones = {}) => {
  try {
    const page = Math.max(parseInt(opciones.page) || PAGINATION.DEFAULT_PAGE, 1);
    const limit = Math.min(
      parseInt(opciones.limit) || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT
    );

    const filtros = { ...opciones, page, limit };

    const [items, total] = await Promise.all([
      documentosRepository.listar(filtros),
      documentosRepository.contar(filtros),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPaginas: Math.ceil(total / limit) || 1,
    };
  } catch (error) {
    debug('Error listando documentos:', error);
    throw createError('Error al obtener los documentos', 500);
  }
};

const obtenerPorSlug = async slug => {
  try {
    return await documentosRepository.obtenerPorSlug(slug);
  } catch (error) {
    debug('Error obteniendo el documento:', error);
    throw createError('Error al obtener el documento', 500);
  }
};

const crear = async (autorId, datos) => {
  try {
    validarDatos(datos);

    const titulo = datos.titulo.trim();

    return await documentosRepository.crear(autorId, {
      ...datos,
      titulo,
      slug: await slugDisponible(titulo),
      etiquetas: normalizarEtiquetas(datos.etiquetas),
    });
  } catch (error) {
    if (error.isOperational) throw error;

    if (error.code === '23503') {
      throw createError('El departamento indicado no existe', 400);
    }

    debug('Error creando el documento:', error);
    throw createError('Error al crear el documento', 500);
  }
};

const actualizar = async (id, usuario, datos) => {
  try {
    if (!datos || Object.keys(datos).length === 0) {
      throw createError('Datos de actualización requeridos', 400);
    }

    validarDatos(datos, { parcial: true });

    const actual = await documentosRepository.obtenerPorId(id);
    if (!actual) {
      return null;
    }

    if (
      usuario.rol !== 'admin' &&
      Number(actual.autor_id) !== Number(usuario.id)
    ) {
      throw createError('Solo puedes editar los documentos que creaste', 403);
    }

    return await documentosRepository.actualizar(id, {
      ...datos,
      etiquetas: normalizarEtiquetas(datos.etiquetas),
    });
  } catch (error) {
    if (error.isOperational) throw error;
    debug('Error actualizando el documento:', error);
    throw createError('Error al actualizar el documento', 500);
  }
};

const eliminar = async (id, usuario) => {
  try {
    const actual = await documentosRepository.obtenerPorId(id);
    if (!actual) {
      return false;
    }

    if (
      usuario.rol !== 'admin' &&
      Number(actual.autor_id) !== Number(usuario.id)
    ) {
      throw createError('Solo puedes eliminar los documentos que creaste', 403);
    }

    return await documentosRepository.eliminar(id);
  } catch (error) {
    if (error.isOperational) throw error;
    debug('Error eliminando el documento:', error);
    throw createError('Error al eliminar el documento', 500);
  }
};

const listarCategorias = async () => {
  try {
    return await documentosRepository.listarCategorias();
  } catch (error) {
    debug('Error listando categorías:', error);
    throw createError('Error al obtener las categorías', 500);
  }
};

module.exports.documentosService = {
  listar,
  obtenerPorSlug,
  crear,
  actualizar,
  eliminar,
  listarCategorias,
  generarSlug,
};
