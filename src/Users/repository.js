// src/Users/repository.js
const db = require('../database/index');
const debug = require('debug')('app:user-repository');

// Campos que sí se pueden devolver al cliente.
//
// Ninguna consulta de este repositorio usa SELECT *: el password_hash no
// debe salir de aquí. Antes salía y cada controlador lo quitaba a mano con
// un destructuring, así que bastaba olvidarlo una vez -- o dejarlo caer en
// un debug -- para filtrar el hash. Quien necesita verificar la contraseña
// es Auth, y para eso tiene su propio authRepository.findByEmail.
const CAMPOS_PUBLICOS = `
  u.id, u.nombre, u.email, u.rol, u.activo, u.ultimo_acceso
`;

// Los mismos campos sin el alias, para los RETURNING
const CAMPOS_PUBLICOS_SIN_ALIAS = CAMPOS_PUBLICOS.replace(/u\./g, '');

// Solo estas columnas se dejan actualizar desde la API
const CAMPOS_EDITABLES = ['nombre', 'email', 'rol', 'activo'];
// Los filtros del listado, armados una sola vez para que contar() y
// getAllUsers() no puedan desincronizarse y devolver un total que no
// corresponde a las filas.
const construirFiltros = ({ email, rol } = {}) => {
  const condiciones = [];
  const valores = [];

  if (email) {
    valores.push(`%${email}%`);
    condiciones.push(`u.email ILIKE $${valores.length}`);
  }

  if (rol) {
    valores.push(rol);
    condiciones.push(`u.rol = $${valores.length}`);
  }

  return {
    where: condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '',
    valores,
  };
};

const getUserById = async id => {
  try {
    const result = await db.query(
      `SELECT ${CAMPOS_PUBLICOS} FROM usuarios u WHERE u.id = $1`,
      [id]
    );

    return result.rows[0] || null;
  } catch (error) {
    debug('Error obteniendo usuario por id:', error);
    throw error;
  }
};

const getAllUsers = async ({ email, rol, page = 1, limit = 10 } = {}) => {
  try {
    const { where, valores } = construirFiltros({ email, rol });

    valores.push(limit);
    valores.push((page - 1) * limit);

    const result = await db.query(
      `SELECT ${CAMPOS_PUBLICOS}
       FROM usuarios u
       ${where}
       ORDER BY u.nombre ASC
       LIMIT $${valores.length - 1} OFFSET $${valores.length}`,
      valores
    );

    return result.rows;
  } catch (error) {
    debug('Error listando usuarios:', error);
    throw error;
  }
};

// Cuántos usuarios hay con esos filtros, para que el panel sepa
// cuántas páginas pintar.
const contarUsuarios = async ({ email, rol } = {}) => {
  try {
    const { where, valores } = construirFiltros({ email, rol });

    const result = await db.query(
      `SELECT COUNT(*)::int AS total FROM usuarios u ${where}`,
      valores
    );

    return result.rows[0].total;
  } catch (error) {
    debug('Error contando usuarios:', error);
    throw error;
  }
};
const updateUser = async (id, updateData) => {
  try {
    const sets = [];
    const valores = [];

    for (const campo of CAMPOS_EDITABLES) {
      if (updateData[campo] !== undefined) {
        valores.push(updateData[campo]);
        sets.push(`${campo} = $${valores.length}`);
      }
    }

    if (sets.length === 0) {
      return await getUserById(id);
    }

    valores.push(id);
    const result = await db.query(
      `UPDATE usuarios
       SET ${sets.join(', ')}
       WHERE id = $${valores.length}
       RETURNING ${CAMPOS_PUBLICOS_SIN_ALIAS}`,
      valores
    );

    return result.rows[0] || null;
  } catch (error) {
    debug('Error actualizando usuario:', error);
    throw error;
  }
};

// Baja lógica: en una intranet el usuario es autor de comunicados,
// documentos y eventos, así que se desactiva en vez de borrarse.
const deleteUser = async id => {
  try {
    const result = await db.query(
      'UPDATE usuarios SET activo = FALSE WHERE id = $1 RETURNING id',
      [id]
    );

    return result.rowCount > 0;
  } catch (error) {
    debug('Error desactivando usuario:', error);
    throw error;
  }
};

const updateUltimoAcceso = async id => {
  try {
    await db.query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1', [
      id,
    ]);
  } catch (error) {
    // No debe tumbar el login si falla
    debug('Error actualizando ultimo_acceso:', error);
  }
};

module.exports.UsersRepository = {
  getUserById,
  contarUsuarios,
  getAllUsers,
  updateUser,
  deleteUser,
  updateUltimoAcceso,
  CAMPOS_EDITABLES,
};
