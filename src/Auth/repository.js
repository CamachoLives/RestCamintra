const db = require('../database/index');
const debug = require('debug')('app:auth-repository');

// Único repositorio que puede leer el password_hash: Auth lo necesita para
// comparar la contraseña. El resto de la API usa UsersRepository, que no
// lo selecciona nunca.
const CAMPOS_LOGIN = 'id, nombre, email, rol, activo, password_hash';

/**
 * Busca por email sin distinguir mayúsculas.
 *
 * El registro guarda el email en minúsculas, pero en la base hay usuarios
 * creados a mano o importados con mayúsculas, y el teclado del móvil
 * capitaliza la primera letra. Con la comparación exacta anterior esa
 * gente simplemente no podía entrar.
 */
const findByEmail = async email => {
  try {
    const result = await db.query(
      `SELECT ${CAMPOS_LOGIN} FROM usuarios WHERE LOWER(email) = LOWER($1)`,
      [String(email ?? '').trim()]
    );

    return result.rows[0] || null;
  } catch (error) {
    debug('Error buscando usuario por email:', error);
    throw error;
  }
};

const create = async user => {
  try {
    const result = await db.query(
      `INSERT INTO usuarios (nombre, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, nombre, email, rol, activo`,
      [user.nombre, user.email, user.password]
    );

    return result.rows[0];
  } catch (error) {
    debug('Error creando usuario:', error);
    throw error;
  }
};

module.exports.authRepository = {
  create,
  findByEmail,
};
