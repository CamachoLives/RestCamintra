// src/Directorio/repository.js
const db = require('../database/index');
const debug = require('debug')('app:directorio-repository');

// La ficha del directorio junta usuario + departamento + perfil
const SELECT_FICHA = `
  SELECT
    c.id,
    c.usuario_id,
    u.nombre,
    u.email,
    u.rol,
    u.activo,
    c.cargo,
    c.extension,
    c.celular,
    c.sede,
    c.fecha_ingreso,
    c.departamento_id,
    d.nombre  AS departamento,
    d.color_hex AS departamento_color,
    c.jefe_id,
    j.nombre  AS jefe,
    p.imagen_url,
    p.biografia
  FROM colaboradores c
  INNER JOIN usuarios u      ON u.id = c.usuario_id
  LEFT  JOIN departamentos d ON d.id = c.departamento_id
  LEFT  JOIN usuarios j      ON j.id = c.jefe_id
  LEFT  JOIN user_profiles p ON p.user_id = c.usuario_id
`;

const CAMPOS_EDITABLES = [
  'departamento_id',
  'cargo',
  'extension',
  'celular',
  'sede',
  'fecha_ingreso',
  'jefe_id',
];

const listar = async ({ q, departamentoId, page = 1, limit = 20 } = {}) => {
  const condiciones = ['u.activo = TRUE'];
  const valores = [];

  if (q) {
    valores.push(`%${q}%`);
    condiciones.push(
      `(u.nombre ILIKE $${valores.length} OR u.email ILIKE $${valores.length} OR c.cargo ILIKE $${valores.length})`
    );
  }

  if (departamentoId) {
    valores.push(departamentoId);
    condiciones.push(`c.departamento_id = $${valores.length}`);
  }

  valores.push(limit);
  valores.push((page - 1) * limit);

  try {
    const result = await db.query(
      `${SELECT_FICHA}
       WHERE ${condiciones.join(' AND ')}
       ORDER BY u.nombre ASC
       LIMIT $${valores.length - 1} OFFSET $${valores.length}`,
      valores
    );

    return result.rows;
  } catch (error) {
    debug('Error listando el directorio:', error);
    throw error;
  }
};

const contar = async ({ q, departamentoId } = {}) => {
  const condiciones = ['u.activo = TRUE'];
  const valores = [];

  if (q) {
    valores.push(`%${q}%`);
    condiciones.push(
      `(u.nombre ILIKE $${valores.length} OR u.email ILIKE $${valores.length} OR c.cargo ILIKE $${valores.length})`
    );
  }

  if (departamentoId) {
    valores.push(departamentoId);
    condiciones.push(`c.departamento_id = $${valores.length}`);
  }

  const result = await db.query(
    `SELECT COUNT(*)::int AS total
     FROM colaboradores c
     INNER JOIN usuarios u ON u.id = c.usuario_id
     WHERE ${condiciones.join(' AND ')}`,
    valores
  );

  return result.rows[0].total;
};

const obtenerPorUsuario = async usuarioId => {
  try {
    const result = await db.query(
      `${SELECT_FICHA} WHERE c.usuario_id = $1`,
      [usuarioId]
    );

    return result.rows[0] || null;
  } catch (error) {
    debug('Error obteniendo ficha:', error);
    throw error;
  }
};

// Crea la ficha si no existe y la actualiza si ya estaba (upsert por usuario)
const guardarFicha = async (usuarioId, datos) => {
  const sets = [];
  const valores = [usuarioId];

  for (const campo of CAMPOS_EDITABLES) {
    if (datos[campo] !== undefined) {
      valores.push(datos[campo] === '' ? null : datos[campo]);
      sets.push(`${campo} = $${valores.length}`);
    }
  }

  try {
    if (sets.length === 0) {
      return await obtenerPorUsuario(usuarioId);
    }

    const columnas = CAMPOS_EDITABLES.filter(c => datos[c] !== undefined);
    const placeholders = columnas.map((_, i) => `$${i + 2}`);

    await db.query(
      `INSERT INTO colaboradores (usuario_id, ${columnas.join(', ')})
       VALUES ($1, ${placeholders.join(', ')})
       ON CONFLICT (usuario_id) DO UPDATE
       SET ${sets.join(', ')}, updated_at = NOW()`,
      valores
    );

    return await obtenerPorUsuario(usuarioId);
  } catch (error) {
    debug('Error guardando ficha:', error);
    throw error;
  }
};

const listarDepartamentos = async () => {
  const result = await db.query(
    `SELECT
       d.id,
       d.nombre,
       d.descripcion,
       d.color_hex,
       COUNT(c.id)::int AS total_colaboradores
     FROM departamentos d
     LEFT JOIN colaboradores c ON c.departamento_id = d.id
     WHERE d.activo = TRUE
     GROUP BY d.id
     ORDER BY d.nombre ASC`
  );

  return result.rows;
};

const crearDepartamento = async ({ nombre, descripcion = '', colorHex }) => {
  const result = await db.query(
    `INSERT INTO departamentos (nombre, descripcion, color_hex)
     VALUES ($1, $2, COALESCE($3, '#374151'))
     RETURNING *`,
    [nombre, descripcion, colorHex]
  );

  return result.rows[0];
};

module.exports.directorioRepository = {
  listar,
  contar,
  obtenerPorUsuario,
  guardarFicha,
  listarDepartamentos,
  crearDepartamento,
};
