const createErrors = require('http-errors');
const debug = require('debug')('app:response');

module.exports.response = {
  success: (
    res,
    message = 'Operación exitosa',
    statusCode = 200,
    data = null,
  ) => {
    const response = {
      success: true,
      message,
      ...(data && { data }),
      timestamp: new Date().toISOString(),
    };

    debug(`Success response [${statusCode}]:`, { message, hasData: !!data });
    res.status(statusCode).json(response);
  },

  error: (res, error = null, statusCode = 500) => {
    let response;

    if (error) {
      // Si es un error personalizado de la aplicación
      if (error.isOperational) {
        response = {
          success: false,
          message: error.message,
          timestamp: new Date().toISOString(),
        };
        statusCode = error.statusCode || statusCode;
      } else {
        // Error interno del servidor
        response = {
          success: false,
          message:
            process.env.NODE_ENV === 'production'
              ? 'Error interno del servidor'
              : error.message,
          timestamp: new Date().toISOString(),
          ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
        };
      }
    } else {
      // Error genérico
      const httpError = new createErrors.InternalServerError();
      response = {
        success: false,
        message: httpError.message,
        timestamp: new Date().toISOString(),
      };
      statusCode = httpError.statusCode;
    }

    debug(`Error response [${statusCode}]:`, { message: response.message });
    res.status(statusCode).json(response);
  },

  // Respuesta para validación de errores
  validationError: (res, errors, message = 'Datos de entrada inválidos') => {
    const response = {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    };

    debug('Validation error [400]:', { message, errorCount: errors.length });
    res.status(400).json(response);
  },

  // Respuesta para errores de autenticación
  unauthorized: (res, message = 'No autorizado') => {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };

    debug('Unauthorized [401]:', { message });
    res.status(401).json(response);
  },

  // Respuesta para errores de permisos
  forbidden: (res, message = 'Acceso denegado') => {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };

    debug('Forbidden [403]:', { message });
    res.status(403).json(response);
  },

  // Respuesta para recursos no encontrados
  notFound: (res, message = 'Recurso no encontrado') => {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };

    debug('Not found [404]:', { message });
    res.status(404).json(response);
  },
};
