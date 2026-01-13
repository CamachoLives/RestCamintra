// src/modules/users/user.repository.js
const db = require('../database/index');
const debug = require('debug')('app:user-repository');

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

module.exports.UsersRepository = {
  getEverything,
  getUserById,
};
