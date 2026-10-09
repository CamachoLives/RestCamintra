const { Pool } = require('pg');
const debug = require('debug')('app:database');
const config = require('../config/index');

let pool = null;

/**
 * Pool de conexiones a PostgreSQL.
 *
 * Antes esto estaba envuelto en un `new Promise` que no esperaba nada (el
 * pool de pg es sincrónico al crearse) y, peor, el manejador de
 * pool.on('error') llamaba a reject() cuando la promesa ya había resuelto:
 * un error de un cliente en reposo -- la base se reinicia, el firewall
 * corta una conexión ociosa -- se perdía sin dejar rastro y sin que nadie
 * se enterara.
 */
const obtenerPool = () => {
  if (pool) return pool;

  pool = new Pool({
    host: config.dbHost,
    port: config.dbPort,
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbName,
    // SSL en producción
    ssl: config.isProduction ? { rejectUnauthorized: false } : false,
    max: 20, // máximo de conexiones
    idleTimeoutMillis: 30000, // cerrar las inactivas a los 30s
    connectionTimeoutMillis: 2000, // 2s para conseguir conexión
  });

  pool.on('connect', () => {
    debug('Conectado a PostgreSQL');
  });

  // El pool descarta el cliente roto y sigue trabajando con los demás;
  // tumbar el proceso aquí dejaría la intranet caída por una conexión
  // ociosa que se cortó.
  pool.on('error', err => {
    debug('Error en un cliente en reposo del pool:', err.message);
  });

  pool.on('remove', () => {
    debug('Cliente retirado del pool');
  });

  return pool;
};

/**
 * Ejecuta una consulta parametrizada.
 *
 * Usa pool.query, que toma y devuelve el cliente por su cuenta. La versión
 * anterior hacía connect() + query() + release() a mano, y si algo fallaba
 * entre el connect y el try, el cliente se quedaba fuera del pool para
 * siempre: a las 20 veces la API se colgaba sin más explicación que un
 * timeout.
 */
const query = async (text, params) => {
  const inicio = Date.now();

  try {
    const result = await obtenerPool().query(text, params);

    debug(`Consulta en ${Date.now() - inicio}ms:`, { text, params });
    return result;
  } catch (error) {
    debug('Error en la consulta:', { text, params, error: error.message });
    throw error;
  }
};

/** Para el apagado ordenado y para las pruebas */
const closePool = async () => {
  if (!pool) return;

  await pool.end();
  pool = null;
  debug('Pool de PostgreSQL cerrado');
};

/** Sonda de conexión: true si la base responde */
const testConnection = async () => {
  try {
    const result = await query('SELECT NOW()');

    debug('Conexión verificada:', result.rows[0]);
    return true;
  } catch (error) {
    debug('No se pudo verificar la conexión:', error.message);
    return false;
  }
};

module.exports = {
  query,
  connectDB: obtenerPool,
  closePool,
  testConnection,
};
