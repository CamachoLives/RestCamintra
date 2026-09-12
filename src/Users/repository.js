// src/Users/repository.js
const db = require('../database/index');
const debug = require('debug')('app:user-repository');

// Campos que sí se pueden devolver al cliente (nunca password_hash)
const CAMPOS_PUBLICOS = `
  u.id, u.nombre, u.email, u.rol, u.activo, u.ultimo_acceso
`;

// Solo estas columnas se dejan actualizar desde la API
const CAMPOS_EDITABLES = ['nombre', 'email', 'rol', 'activo'];

const getEverything = async email => {
  try {
    const res = await db.query('SELECT * FROM usuarios WHERE email = $1', [
      email,
    ]);
    return res.rows[0]; // return the first matching user
  } catch (error) {
    debug("user don't found:", error);
    throw error;
  }
};

const getUserById = async id => {
  try {
    const result = await db.query('SELECT * FROM usuarios WHERE id = $1', [id]);

    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Error en getUserById (repository):', error);
    throw error;
  }
};

const getAllUsers = async ({ email, rol, page = 1, limit = 10 } = {}) => {
  try {
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

    const where = condiciones.length
      ? `WHERE ${condiciones.join(' AND ')}`
      : '';

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
       RETURNING *`,
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
      `UPDATE usuarios SET activo = FALSE WHERE id = $1 RETURNING id`,
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
  getEverything,
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser,
  updateUltimoAcceso,
};
