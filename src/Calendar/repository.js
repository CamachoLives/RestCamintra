// src/Calendar/repository.js
const db = require('../database/index');
const debug = require('debug')('app:calendar-repository');

const SELECT_EVENTO = `
  SELECT
    e.id,
    e.titulo,
    e.descripcion,
    e.tipo,
    e.inicio,
    e.fin,
    e.todo_el_dia,
    e.lugar,
    e.color_hex,
    e.departamento_id,
    d.nombre AS departamento,
    e.creado_por,
    u.nombre AS creador,
    e.created_at,
    e.updated_at
  FROM eventos e
  INNER JOIN usuarios u      ON u.id = e.creado_por
  LEFT  JOIN departamentos d ON d.id = e.departamento_id
`;

const CAMPOS_EDITABLES = [
  'titulo',
  'descripcion',
  'tipo',
  'inicio',
  'fin',
  'todo_el_dia',
  'lugar',
  'color_hex',
  'departamento_id',
];

// Un evento entra en el rango si se solapa con el, no solo si empieza dentro
const listar = async ({ desde, hasta, tipo, departamentoId } = {}) => {
  const condiciones = [];
  const valores = [];

  if (desde) {
    valores.push(desde);
    condiciones.push(`COALESCE(e.fin, e.inicio) >= $${valores.length}`);
  }

  if (hasta) {
    valores.push(hasta);
    condiciones.push(`e.inicio <= $${valores.length}`);
  }

  if (tipo) {
    valores.push(tipo);
    condiciones.push(`e.tipo = $${valores.length}`);
  }

  if (departamentoId) {
    valores.push(departamentoId);
    condiciones.push(`e.departamento_id = $${valores.length}`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  try {
    const result = await db.query(
      `${SELECT_EVENTO} ${where} ORDER BY e.inicio ASC`,
      valores
    );

    return result.rows;
  } catch (error) {
    debug('Error listando eventos:', error);
    throw error;
  }
};

const proximos = async (limite = 5) => {
  const result = await db.query(
    `${SELECT_EVENTO}
     WHERE COALESCE(e.fin, e.inicio) >= NOW()
     ORDER BY e.inicio ASC
     LIMIT $1`,
    [limite]
  );

  return result.rows;
};

const obtener = async id => {
  const result = await db.query(`${SELECT_EVENTO} WHERE e.id = $1`, [id]);
  return result.rows[0] || null;
};

const crear = async (creadoPor, datos) => {
  const result = await db.query(
    `INSERT INTO eventos
       (titulo, descripcion, tipo, inicio, fin, todo_el_dia, lugar,
        color_hex, departamento_id, creado_por)
     VALUES ($1, $2, COALESCE($3, 'evento'), $4, $5, COALESCE($6, FALSE),
             $7, COALESCE($8, '#2563eb'), $9, $10)
     RETURNING id`,
    [
      datos.titulo,
      datos.descripcion || '',
      datos.tipo,
      datos.inicio,
      datos.fin || null,
      datos.todo_el_dia,
      datos.lugar || '',
      datos.color_hex,
      datos.departamento_id || null,
      creadoPor,
    ]
  );

  return await obtener(result.rows[0].id);
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
    return await obtener(id);
  }

  sets.push('updated_at = NOW()');
  valores.push(id);

  const result = await db.query(
    `UPDATE eventos SET ${sets.join(', ')} WHERE id = $${valores.length} RETURNING id`,
    valores
  );

  if (result.rowCount === 0) return null;

  return await obtener(id);
};

const eliminar = async id => {
  const result = await db.query('DELETE FROM eventos WHERE id = $1', [id]);
  return result.rowCount > 0;
};

module.exports.calendarRepository = {
  listar,
  proximos,
  obtener,
  crear,
  actualizar,
  eliminar,
};
