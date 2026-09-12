// src/Notifications/repository.js
const db = require('../database/index');
const debug = require('debug')('app:notifications-repository');

const listar = async (usuarioId, { soloNoLeidas, limite = 20 } = {}) => {
  const condiciones = ['usuario_id = $1'];
  const valores = [usuarioId];

  if (soloNoLeidas) {
    condiciones.push('leida = FALSE');
  }

  valores.push(limite);

  try {
    const result = await db.query(
      `SELECT id, titulo, mensaje, tipo, enlace, leida, created_at
       FROM notificaciones
       WHERE ${condiciones.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${valores.length}`,
      valores
    );

    return result.rows;
  } catch (error) {
    debug('Error listando notificaciones:', error);
    throw error;
  }
};

const contarNoLeidas = async usuarioId => {
  const result = await db.query(
    `SELECT COUNT(*)::int AS total
     FROM notificaciones
     WHERE usuario_id = $1 AND leida = FALSE`,
    [usuarioId]
  );

  return result.rows[0].total;
};

const crear = async ({ usuarioId, titulo, mensaje, tipo, enlace }) => {
  const result = await db.query(
    `INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo, enlace)
     VALUES ($1, $2, $3, COALESCE($4, 'info'), $5)
     RETURNING *`,
    [usuarioId, titulo, mensaje || '', tipo, enlace || '']
  );

  return result.rows[0];
};

// Avisa a todo el mundo salvo a quien genera el aviso
const crearParaTodos = async ({ titulo, mensaje, tipo, enlace, exceptoId }) => {
  const result = await db.query(
    `INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo, enlace)
     SELECT u.id, $1, $2, COALESCE($3, 'info'), $4
     FROM usuarios u
     WHERE u.activo = TRUE AND ($5::int IS NULL OR u.id <> $5)`,
    [titulo, mensaje || '', tipo, enlace || '', exceptoId || null]
  );

  return result.rowCount;
};

// El usuario_id en el WHERE evita que alguien marque notificaciones ajenas
const marcarLeida = async (id, usuarioId) => {
  const result = await db.query(
    `UPDATE notificaciones
     SET leida = TRUE
     WHERE id = $1 AND usuario_id = $2
     RETURNING id`,
    [id, usuarioId]
  );

  return result.rowCount > 0;
};

const marcarTodasLeidas = async usuarioId => {
  const result = await db.query(
    `UPDATE notificaciones
     SET leida = TRUE
     WHERE usuario_id = $1 AND leida = FALSE`,
    [usuarioId]
  );

  return result.rowCount;
};

module.exports.notificationsRepository = {
  listar,
  contarNoLeidas,
  crear,
  crearParaTodos,
  marcarLeida,
  marcarTodasLeidas,
};
