require('dotenv').config();

const debug = require('debug')('app:main');
const { crearApp } = require('./src/app');
const config = require('./src/config/index');
const db = require('./src/database/index');

const app = crearApp();

const server = app.listen(config.port, () => {
  debug(`Server is running on port: ${config.port}`);
});

/**
 * Apagado ordenado.
 *
 * Sin esto, un redespliegue cortaba las peticiones en curso y dejaba las
 * conexiones del pool de PostgreSQL abiertas hasta que el proceso moría.
 */
const apagar = async señal => {
  debug(`${señal} recibido, cerrando el servidor...`);

  server.close(async () => {
    try {
      await db.closePool();
    } finally {
      process.exit(0);
    }
  });

  // Si algo se queda colgado, no esperar para siempre
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGTERM', () => apagar('SIGTERM'));
process.on('SIGINT', () => apagar('SIGINT'));

// Un rechazo sin catch dejaba el proceso vivo pero en un estado incierto
process.on('unhandledRejection', razon => {
  debug('Promesa rechazada sin manejar:', razon);
  apagar('unhandledRejection');
});

process.on('uncaughtException', error => {
  debug('Excepción no capturada:', error);
  process.exit(1);
});

module.exports = server;
