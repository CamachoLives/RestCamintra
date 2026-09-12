// src/Documentos/repository.js
const db = require('../database/index');
const debug = require('debug')('app:documentos-repository');

const SELECT_DOCUMENTO = `
  SELECT
    d.id,
    d.titulo,
    d.slug,
    d.resumen,
    d.categoria,
    d.etiquetas,
    d.version,
    d.estado,
    d.vistas,
    d.departamento_id,
    dep.nombre AS departamento,
    d.autor_id,
    u.nombre AS autor,
    d.created_at,
    d.updated_at
  FROM documentos d
  INNER JOIN usuarios u       ON u.id = d.autor_id
  LEFT  JOIN departamentos dep ON dep.id = d.departamento_id
`;

const CAMPOS_EDITABLES = [
  'titulo',
  'resumen',
  'contenido',
  'categoria',
  'etiquetas',
  'estado',
  'departamento_id',
];

const construirFiltros = ({ q, categoria, etiqueta, incluirBorradores }, valores) => {
  const condiciones = [
    incluirBorradores ? `d.estado <> 'archivado'` : `d.estado = 'publicado'`,
  ];

  if (q) {
    valores.push(`%${q}%`);
    condiciones.push(
      `(d.titulo ILIKE $${valores.length} OR d.resumen ILIKE $${valores.length} OR d.contenido ILIKE $${valores.length})`
    );
  }

  if (categoria) {
    valores.push(categoria);
    condiciones.push(`d.categoria = $${valores.length}`);
  }

  if (etiqueta) {
    valores.push(etiqueta);
    condiciones.push(`$${valores.length} = ANY(d.etiquetas)`);
  }

  return condiciones.join(' AND ');
};

// El listado no trae el contenido completo: solo el resumen
const listar = async (opciones = {}) => {
  const valores = [];
  const where = construirFiltros(opciones, valores);

  const { page = 1, limit = 10 } = opciones;
  valores.push(limit);
  valores.push((page - 1) * limit);

  try {
    const result = await db.query(
      `${SELECT_DOCUMENTO}
       WHERE ${where}
       ORDER BY d.updated_at DESC
       LIMIT $${valores.length - 1} OFFSET $${valores.length}`,
      valores
    );

    return result.rows;
  } catch (error) {
    debug('Error listando documentos:', error);
    throw error;
  }
};

const contar = async (opciones = {}) => {
  const valores = [];
  const where = construirFiltros(opciones, valores);

  const result = await db.query(
    `SELECT COUNT(*)::int AS total FROM documentos d WHERE ${where}`,
    valores
  );

  return result.rows[0].total;
};

const obtenerPorId = async id => {
  const result = await db.query(
    `${SELECT_DOCUMENTO.replace('d.updated_at', 'd.contenido, d.updated_at')}
     WHERE d.id = $1`,
    [id]
  );

  return result.rows[0] || null;
};

// La lectura por slug suma una vista en la misma consulta
const obtenerPorSlug = async slug => {
  const actualizado = await db.query(
    `UPDATE documentos SET vistas = vistas + 1 WHERE slug = $1 RETURNING id`,
    [slug]
  );

  if (actualizado.rowCount === 0) return null;

  return await obtenerPorId(actualizado.rows[0].id);
};

const existeSlug = async slug => {
  const result = await db.query('SELECT 1 FROM documentos WHERE slug = $1', [
    slug,
  ]);

  return result.rowCount > 0;
};

const crear = async (autorId, datos) => {
  const result = await db.query(
    `INSERT INTO documentos
       (titulo, slug, resumen, contenido, categoria, etiquetas,
        estado, departamento_id, autor_id)
     VALUES ($1, $2, $3, $4, COALESCE($5, 'General'), COALESCE($6::text[], '{}'),
             COALESCE($7, 'borrador'), $8, $9)
     RETURNING id`,
    [
      datos.titulo,
      datos.slug,
      datos.resumen || '',
      datos.contenido,
      datos.categoria,
      datos.etiquetas,
      datos.estado,
      datos.departamento_id || null,
      autorId,
    ]
  );

  return await obtenerPorId(result.rows[0].id);
};

const actualizar = async (id, datos) => {
  const sets = [];
  const valores = [];

  for (const campo of CAMPOS_EDITABLES) {
    if (datos[campo] !== undefined) {
      valores.push(datos[campo] === '' ? null : datos[campo]);
      sets.push(`${campo} = $${valores.length}`);
    }
  }

  if (sets.length === 0) {
    return await obtenerPorId(id);
  }

  // Cambiar el contenido sube la version del documento
  if (datos.contenido !== undefined) {
    sets.push('version = version + 1');
  }

  sets.push('updated_at = NOW()');
  valores.push(id);

  const result = await db.query(
    `UPDATE documentos SET ${sets.join(', ')} WHERE id = $${valores.length} RETURNING id`,
    valores
  );

  if (result.rowCount === 0) return null;

  return await obtenerPorId(id);
};

const eliminar = async id => {
  const result = await db.query('DELETE FROM documentos WHERE id = $1', [id]);
  return result.rowCount > 0;
};

const listarCategorias = async () => {
  const result = await db.query(
    `SELECT categoria AS nombre, COUNT(*)::int AS total
     FROM documentos
     WHERE estado = 'publicado'
     GROUP BY categoria
     ORDER BY categoria ASC`
  );

  return result.rows;
};

module.exports.documentosRepository = {
  listar,
  contar,
  obtenerPorId,
  obtenerPorSlug,
  existeSlug,
  crear,
  actualizar,
  eliminar,
  listarCategorias,
};
