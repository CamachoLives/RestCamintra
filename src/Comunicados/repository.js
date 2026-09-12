// src/Comunicados/repository.js
const db = require('../database/index');
const debug = require('debug')('app:comunicados-repository');

// $1 siempre es el usuario que consulta, para saber si ya lo leyó
const SELECT_COMUNICADO = `
  SELECT
    c.id,
    c.titulo,
    c.resumen,
    c.contenido,
    c.imagen_url,
    c.prioridad,
    c.estado,
    c.fijado,
    c.publicado_en,
    c.expira_en,
    c.created_at,
    c.updated_at,
    c.categoria_id,
    cat.nombre    AS categoria,
    cat.color_hex AS categoria_color,
    c.autor_id,
    u.nombre      AS autor,
    (l.usuario_id IS NOT NULL) AS leido,
    (SELECT COUNT(*)::int FROM comunicado_lecturas cl WHERE cl.comunicado_id = c.id) AS total_lecturas
  FROM comunicados c
  INNER JOIN usuarios u                ON u.id = c.autor_id
  LEFT  JOIN comunicado_categorias cat ON cat.id = c.categoria_id
  LEFT  JOIN comunicado_lecturas l     ON l.comunicado_id = c.id AND l.usuario_id = $1
`;

const CAMPOS_EDITABLES = [
  'titulo',
  'resumen',
  'contenido',
  'categoria_id',
  'imagen_url',
  'prioridad',
  'estado',
  'fijado',
  'expira_en',
];

// Un comunicado está vigente si está publicado y no se le pasó la fecha
const VIGENTE = `c.estado = 'publicado' AND (c.expira_en IS NULL OR c.expira_en > NOW())`;

const construirFiltros = ({ q, categoriaId, prioridad, soloNoLeidos, incluirBorradores }, valores) => {
  const condiciones = [incluirBorradores ? `c.estado <> 'archivado'` : VIGENTE];

  if (q) {
    valores.push(`%${q}%`);
    condiciones.push(
      `(c.titulo ILIKE $${valores.length} OR c.resumen ILIKE $${valores.length} OR c.contenido ILIKE $${valores.length})`
    );
  }

  if (categoriaId) {
    valores.push(categoriaId);
    condiciones.push(`c.categoria_id = $${valores.length}`);
  }

  if (prioridad) {
    valores.push(prioridad);
    condiciones.push(`c.prioridad = $${valores.length}`);
  }

  if (soloNoLeidos) {
    condiciones.push(`l.usuario_id IS NULL`);
  }

  return condiciones.join(' AND ');
};

const listar = async (usuarioId, opciones = {}) => {
  const valores = [usuarioId];
  const where = construirFiltros(opciones, valores);

  const { page = 1, limit = 10 } = opciones;
  valores.push(limit);
  valores.push((page - 1) * limit);

  try {
    const result = await db.query(
      `${SELECT_COMUNICADO}
       WHERE ${where}
       ORDER BY c.fijado DESC, c.publicado_en DESC NULLS LAST, c.created_at DESC
       LIMIT $${valores.length - 1} OFFSET $${valores.length}`,
      valores
    );

    return result.rows;
  } catch (error) {
    debug('Error listando comunicados:', error);
    throw error;
  }
};

const contar = async (usuarioId, opciones = {}) => {
  const valores = [usuarioId];
  const where = construirFiltros(opciones, valores);

  const result = await db.query(
    `SELECT COUNT(*)::int AS total
     FROM comunicados c
     LEFT JOIN comunicado_lecturas l ON l.comunicado_id = c.id AND l.usuario_id = $1
     WHERE ${where}`,
    valores
  );

  return result.rows[0].total;
};

const obtener = async (id, usuarioId) => {
  const result = await db.query(`${SELECT_COMUNICADO} WHERE c.id = $2`, [
    usuarioId,
    id,
  ]);

  return result.rows[0] || null;
};

const crear = async (autorId, datos) => {
  // Si nace publicado, la fecha de publicación es ahora
  const publicadoEn = datos.estado === 'publicado' ? new Date() : null;

  const result = await db.query(
    `INSERT INTO comunicados
       (titulo, resumen, contenido, categoria_id, autor_id, imagen_url,
        prioridad, estado, fijado, publicado_en, expira_en)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'normal'),
             COALESCE($8, 'borrador'), COALESCE($9, FALSE), $10, $11)
     RETURNING id`,
    [
      datos.titulo,
      datos.resumen || '',
      datos.contenido,
      datos.categoria_id || null,
      autorId,
      datos.imagen_url || '',
      datos.prioridad,
      datos.estado,
      datos.fijado,
      publicadoEn,
      datos.expira_en || null,
    ]
  );

  return await obtener(result.rows[0].id, autorId);
};

const actualizar = async (id, usuarioId, datos) => {
  const sets = [];
  const valores = [];

  for (const campo of CAMPOS_EDITABLES) {
    if (datos[campo] !== undefined) {
      valores.push(datos[campo] === '' ? null : datos[campo]);
      sets.push(`${campo} = $${valores.length}`);
    }
  }

  if (sets.length === 0) {
    return await obtener(id, usuarioId);
  }

  // Al publicar por primera vez se sella publicado_en
  if (datos.estado === 'publicado') {
    sets.push(`publicado_en = COALESCE(publicado_en, NOW())`);
  }

  sets.push(`updated_at = NOW()`);
  valores.push(id);

  const result = await db.query(
    `UPDATE comunicados SET ${sets.join(', ')} WHERE id = $${valores.length} RETURNING id`,
    valores
  );

  if (result.rowCount === 0) return null;

  return await obtener(id, usuarioId);
};

const eliminar = async id => {
  const result = await db.query('DELETE FROM comunicados WHERE id = $1', [id]);
  return result.rowCount > 0;
};

const marcarLeido = async (id, usuarioId) => {
  const result = await db.query(
    `INSERT INTO comunicado_lecturas (comunicado_id, usuario_id)
     VALUES ($1, $2)
     ON CONFLICT (comunicado_id, usuario_id) DO NOTHING
     RETURNING leido_en`,
    [id, usuarioId]
  );

  // Si no insertó nada es porque ya estaba leído: igual es un éxito
  return result.rowCount > 0;
};

const contarNoLeidos = async usuarioId => {
  const result = await db.query(
    `SELECT COUNT(*)::int AS total
     FROM comunicados c
     LEFT JOIN comunicado_lecturas l
       ON l.comunicado_id = c.id AND l.usuario_id = $1
     WHERE ${VIGENTE} AND l.usuario_id IS NULL`,
    [usuarioId]
  );

  return result.rows[0].total;
};

const listarCategorias = async () => {
  const result = await db.query(
    `SELECT
       cat.id,
       cat.nombre,
       cat.color_hex,
       COUNT(c.id) FILTER (WHERE c.estado = 'publicado')::int AS total_comunicados
     FROM comunicado_categorias cat
     LEFT JOIN comunicados c ON c.categoria_id = cat.id
     GROUP BY cat.id
     ORDER BY cat.nombre ASC`
  );

  return result.rows;
};

module.exports.comunicadosRepository = {
  listar,
  contar,
  obtener,
  crear,
  actualizar,
  eliminar,
  marcarLeido,
  contarNoLeidos,
  listarCategorias,
};
