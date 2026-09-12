const { notificationsRepository } = require('./repository');
const { createError } = require('../middleware/errorHandler');
const debug = require('debug')('app:notifications-service');

const listar = async (usuarioId, opciones = {}) => {
  try {
    const limite = Math.min(Math.max(parseInt(opciones.limite) || 20, 1), 100);

    const [items, noLeidas] = await Promise.all([
      notificationsRepository.listar(usuarioId, { ...opciones, limite }),
      notificationsRepository.contarNoLeidas(usuarioId),
    ]);

    return { items, noLeidas };
  } catch (error) {
    debug('Error listando notificaciones:', error);
    throw createError('Error al obtener las notificaciones', 500);
  }
};

const marcarLeida = async (id, usuarioId) => {
  try {
    const marcada = await notificationsRepository.marcarLeida(id, usuarioId);

    if (!marcada) {
      throw createError('Notificación no encontrada', 404);
    }

    return { noLeidas: await notificationsRepository.contarNoLeidas(usuarioId) };
  } catch (error) {
    if (error.isOperational) throw error;
    debug('Error marcando la notificación:', error);
    throw createError('Error al marcar la notificación', 500);
  }
};

const marcarTodasLeidas = async usuarioId => {
  try {
    const marcadas = await notificationsRepository.marcarTodasLeidas(usuarioId);

    return { marcadas, noLeidas: 0 };
  } catch (error) {
    debug('Error marcando todas las notificaciones:', error);
    throw createError('Error al marcar las notificaciones', 500);
  }
};

// La usan los demás módulos cuando publican algo que le importa a todos.
// Nunca debe tumbar la operación que la dispara: si falla, solo se registra.
const avisarATodos = async datos => {
  try {
    return await notificationsRepository.crearParaTodos(datos);
  } catch (error) {
    debug('No se pudo notificar a todos:', error);
    return 0;
  }
};

module.exports.notificationsService = {
  listar,
  marcarLeida,
  marcarTodasLeidas,
  avisarATodos,
};
