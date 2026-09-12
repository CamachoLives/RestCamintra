// src/Dashboard/repository.js
const db = require('../database/index');
const debug = require('debug')('app:dashboard-repository');

// Todos los contadores de la portada en una sola ida a la base
const indicadores = async usuarioId => {
  try {
    const result = await db.query(
      `SELECT
         (SELECT COUNT(*)::int FROM comunicados
           WHERE estado = 'publicado'
             AND (expira_en IS NULL OR expira_en > NOW()))        AS comunicados_vigentes,
         (SELECT COUNT(*)::int FROM comunicados c
           LEFT JOIN comunicado_lecturas l
             ON l.comunicado_id = c.id AND l.usuario_id = $1
           WHERE c.estado = 'publicado'
             AND (c.expira_en IS NULL OR c.expira_en > NOW())
             AND l.usuario_id IS NULL)                            AS comunicados_no_leidos,
         (SELECT COUNT(*)::int FROM usuarios WHERE activo = TRUE) AS colaboradores,
         (SELECT COUNT(*)::int FROM departamentos WHERE activo = TRUE) AS departamentos,
         (SELECT COUNT(*)::int FROM eventos
           WHERE inicio BETWEEN NOW() AND NOW() + INTERVAL '30 days') AS eventos_proximos,
         (SELECT COUNT(*)::int FROM documentos
           WHERE estado = 'publicado')                            AS documentos,
         (SELECT COUNT(*)::int FROM notificaciones
           WHERE usuario_id = $1 AND leida = FALSE)               AS notificaciones_pendientes`,
      [usuarioId]
    );

    return result.rows[0];
  } catch (error) {
    debug('Error obteniendo indicadores:', error);
    throw error;
  }
};

const ultimosComunicados = async (usuarioId, limite = 5) => {
  const result = await db.query(
    `SELECT
       c.id,
       c.titulo,
       c.resumen,
       c.prioridad,
       c.fijado,
       c.publicado_en,
       cat.nombre    AS categoria,
       cat.color_hex AS categoria_color,
       u.nombre      AS autor,
       (l.usuario_id IS NOT NULL) AS leido
     FROM comunicados c
     INNER JOIN usuarios u                ON u.id = c.autor_id
     LEFT  JOIN comunicado_categorias cat ON cat.id = c.categoria_id
     LEFT  JOIN comunicado_lecturas l     ON l.comunicado_id = c.id AND l.usuario_id = $1
     WHERE c.estado = 'publicado'
       AND (c.expira_en IS NULL OR c.expira_en > NOW())
     ORDER BY c.fijado DESC, c.publicado_en DESC NULLS LAST
     LIMIT $2`,
    [usuarioId, limite]
  );

  return result.rows;
};

const proximosEventos = async (limite = 5) => {
  const result = await db.query(
    `SELECT
       e.id, e.titulo, e.tipo, e.inicio, e.fin, e.todo_el_dia,
       e.lugar, e.color_hex, d.nombre AS departamento
     FROM eventos e
     LEFT JOIN departamentos d ON d.id = e.departamento_id
     WHERE COALESCE(e.fin, e.inicio) >= NOW()
     ORDER BY e.inicio ASC
     LIMIT $1`,
    [limite]
  );

  return result.rows;
};

const documentosRecientes = async (limite = 5) => {
  const result = await db.query(
    `SELECT d.id, d.titulo, d.slug, d.resumen, d.categoria, d.vistas, d.updated_at
     FROM documentos d
     WHERE d.estado = 'publicado'
     ORDER BY d.updated_at DESC
     LIMIT $1`,
    [limite]
  );

  return result.rows;
};

// Para la gráfica de la portada: cuánta gente hay por área
const colaboradoresPorDepartamento = async () => {
  const result = await db.query(
    `SELECT
       d.nombre,
       d.color_hex,
       COUNT(c.id)::int AS total
     FROM departamentos d
     LEFT JOIN colaboradores c ON c.departamento_id = d.id
     LEFT JOIN usuarios u      ON u.id = c.usuario_id AND u.activo = TRUE
     WHERE d.activo = TRUE
     GROUP BY d.id
     ORDER BY total DESC, d.nombre ASC`
  );

  return result.rows;
};

module.exports.dashboardRepository = {
  indicadores,
  ultimosComunicados,
  proximosEventos,
  documentosRecientes,
  colaboradoresPorDepartamento,
};
