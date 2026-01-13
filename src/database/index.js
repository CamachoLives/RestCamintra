const { Pool } = require('pg');
const debug = require('debug')('app:database');
const config = require('../config/index');
let pool = null;

const connectDB = () => {
  return new Promise((resolve, reject) => {
    try {
      if (!pool) {
        pool = new Pool({
          host: config.dbHost,
          port: config.dbPort,
          user: config.dbUser,
          password: config.dbPassword,
          database: config.dbName,
          // SSL Seguridad
          ssl: config.isProduction ? { rejectUnauthorized: false } : false,
          max: 20, // Máximo de conexiones
          idleTimeoutMillis: 30000, // cerrar conexiones inactivas después de 30s
          connectionTimeoutMillis: 2000, // timeout de conexión de 2s
        });

        pool.on('connect', () => {
          debug('✅ Conectado a PostgreSQL');
          if (config.isDevelopment) {
            console.log('📊 Database connected successfully');
          }
        });

        pool.on('error', err => {
          debug('❌ Database connection error:', err);
          console.error('Database error:', err);
          reject(err);
        });

        pool.on('remove', () => {
          debug('🔌 Database connection removed from pool');
        });
      }
      resolve(pool);
    } catch (error) {
      debug('❌ Database connection failed:', error);
      reject(error);
    }
  });
};

const query = async (text, params) => {
  const pool = await connectDB();
  const client = await pool.connect();

  try {
    const start = Date.now();
    const result = await client.query(text, params);
    const duration = Date.now() - start;

    debug(`Query executed in ${duration}ms:`, { text, params });
    return result;
  } catch (error) {
    debug('Query error:', { text, params, error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

// Función para cerrar todas las conexiones (útil para testing)
const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    debug('🔌 Database pool closed');
  }
};

// Función para verificar la conexión
const testConnection = async () => {
  try {
    const result = await query('SELECT NOW()');
    debug('✅ Database connection test successful:', result.rows[0]);
    return true;
  } catch (error) {
    debug('❌ Database connection test failed:', error);
    return false;
  }
};

module.exports = {
  query,
  connectDB,
  closePool,
  testConnection,
};
