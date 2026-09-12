const { calendarRepository } = require('./repository');
const { createError } = require('../middleware/errorHandler');
const { notificationsService } = require('../Notifications/services');
const debug = require('debug')('app:calendar-service');

const TIPOS = ['evento', 'capacitacion', 'reunion', 'festivo', 'cumpleanos'];

const validarDatos = (datos, { parcial = false } = {}) => {
  if (!parcial) {
    if (!datos.titulo || !datos.titulo.trim()) {
      throw createError('El título del evento es requerido', 400);
    }

    if (!datos.inicio) {
      throw createError('La fecha de inicio es requerida', 400);
    }
  }

  if (datos.tipo && !TIPOS.includes(datos.tipo)) {
    throw createError(`Tipo inválido, use: ${TIPOS.join(', ')}`, 400);
  }

  if (datos.inicio && Number.isNaN(Date.parse(datos.inicio))) {
    throw createError('La fecha de inicio no es válida', 400);
  }

  if (datos.fin && Number.isNaN(Date.parse(datos.fin))) {
    throw createError('La fecha de fin no es válida', 400);
  }

  if (
    datos.inicio &&
    datos.fin &&
    Date.parse(datos.fin) < Date.parse(datos.inicio)
  ) {
    throw createError('La fecha de fin no puede ser anterior al inicio', 400);
  }
};

const listar = async (opciones = {}) => {
  try {
    return await calendarRepository.listar(opciones);
  } catch (error) {
    debug('Error listando eventos:', error);
    throw createError('Error al obtener los eventos', 500);
  }
};

const proximos = async (limite = 5) => {
  try {
    const tope = Math.min(Math.max(parseInt(limite) || 5, 1), 50);
    return await calendarRepository.proximos(tope);
  } catch (error) {
    debug('Error obteniendo próximos eventos:', error);
    throw createError('Error al obtener los próximos eventos', 500);
  }
};

const obtener = async id => {
  try {
    return await calendarRepository.obtener(id);
  } catch (error) {
    debug('Error obteniendo el evento:', error);
    throw createError('Error al obtener el evento', 500);
  }
};

const crear = async (creadoPor, datos) => {
  try {
    validarDatos(datos);

    const evento = await calendarRepository.crear(creadoPor, {
      ...datos,
      titulo: datos.titulo.trim(),
    });

    await notificationsService.avisarATodos({
      titulo: 'Nuevo evento en el calendario',
      mensaje: evento.titulo,
      tipo: 'evento',
      enlace: `/calendario?evento=${evento.id}`,
      exceptoId: creadoPor,
    });

    return evento;
  } catch (error) {
    if (error.isOperational) throw error;

    if (error.code === '23503') {
      throw createError('El departamento indicado no existe', 400);
    }

    debug('Error creando el evento:', error);
    throw createError('Error al crear el evento', 500);
  }
};

const actualizar = async (id, usuario, datos) => {
  try {
    if (!datos || Object.keys(datos).length === 0) {
      throw createError('Datos de actualización requeridos', 400);
    }

    validarDatos(datos, { parcial: true });

    const actual = await calendarRepository.obtener(id);
    if (!actual) {
      return null;
    }

    if (
      usuario.rol !== 'admin' &&
      Number(actual.creado_por) !== Number(usuario.id)
    ) {
      throw createError('Solo puedes editar los eventos que creaste', 403);
    }

    // El check de la base compara los valores finales, no solo los enviados
    validarDatos(
      {
        inicio: datos.inicio || actual.inicio,
        fin: datos.fin !== undefined ? datos.fin : actual.fin,
      },
      { parcial: true }
    );

    return await calendarRepository.actualizar(id, datos);
  } catch (error) {
    if (error.isOperational) throw error;
    debug('Error actualizando el evento:', error);
    throw createError('Error al actualizar el evento', 500);
  }
};

const eliminar = async (id, usuario) => {
  try {
    const actual = await calendarRepository.obtener(id);
    if (!actual) {
      return false;
    }

    if (
      usuario.rol !== 'admin' &&
      Number(actual.creado_por) !== Number(usuario.id)
    ) {
      throw createError('Solo puedes eliminar los eventos que creaste', 403);
    }

    return await calendarRepository.eliminar(id);
  } catch (error) {
    if (error.isOperational) throw error;
    debug('Error eliminando el evento:', error);
    throw createError('Error al eliminar el evento', 500);
  }
};

module.exports.calendarService = {
  listar,
  proximos,
  obtener,
  crear,
  actualizar,
  eliminar,
};
