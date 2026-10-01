const express = require('express');
const cors = require('cors');
const config = require('./config/index');

const {
  generalRateLimit,
  helmetConfig,
  sanitizeLogs,
} = require('./middleware/security');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Módulos
const { configuracion } = require('./configuracion/index');
const { Auth } = require('./Auth/index');
const { Users } = require('./Users/index');
const { Directorio } = require('./Directorio/index');
const { Comunicados } = require('./Comunicados/index');
const { Calendar } = require('./Calendar/index');
const { Documentos } = require('./Documentos/index');
const { Dashboard } = require('./Dashboard/index');
const { Notifications } = require('./Notifications/index');

/**
 * Arma la aplicación sin escucharla.
 *
 * Antes todo esto vivía en index.js junto al app.listen(), así que no había
 * forma de levantar la API en una prueba sin ocupar un puerto. Ahora
 * index.js solo la escucha y las pruebas la piden con crearApp().
 */
const crearApp = () => {
  const app = express();

  // Seguridad
  app.use(helmetConfig);
  app.use(generalRateLimit);
  app.use(sanitizeLogs);

  app.use(
    cors({
      origin: config.frontendUrl,
      credentials: true,
    })
  );

  // Cuerpo de las peticiones
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Sonda para el monitoreo y para el despliegue
  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
    });
  });

  // Módulos de la intranet
  Auth(app);
  Users(app);
  configuracion(app);
  Directorio(app);
  Comunicados(app);
  Calendar(app);
  Documentos(app);
  Dashboard(app);
  Notifications(app);

  // Siempre al final: 404 y manejo de errores
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = { crearApp };
