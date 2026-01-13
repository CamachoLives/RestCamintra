// src/modules/users/user.repository.js
const db = require('../database/index');
const debug = require('debug')('app:user-repository');
// const { response } = require('../common/response');

const findByEmail = async email => {
  console.log(email)
  try {
    const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [
      email,
    ]);

    return result.rows[0] || null;
  } catch (error) {
    debug('Error buscando usuario por email:', error);
    throw error;
  }
};

const create = async user => {
  try {
    const result = await db.query(
      'INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
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
