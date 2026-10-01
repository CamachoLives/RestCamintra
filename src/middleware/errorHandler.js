const debug = require('debug')('app:error-handler');
const { response } = require('../common/response');

// Clase personalizada para errores de la aplicación
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Traduce los errores de las librerías a AppError, con un mensaje que el
 * usuario pueda entender. Lo que no reconoce lo devuelve tal cual, para
 * que siga siendo un error inesperado y no se filtre el detalle interno.
 */
const traducirError = err => {
  // Validación de Mongoose
  if (err.name === 'ValidationError' && err.errors) {
    const mensaje = Object.values(err.errors)
      .map(val => val.message)
      .join(', ');
    return new AppError(mensaje, 400);
  }

  // Duplicado en base de datos (MongoDB)
  if (err.code === 11000 && err.keyValue) {
    const campo = Object.keys(err.keyValue)[0];
    return new AppError(`${campo} ya existe`, 400);
  }

  // JWT
  if (err.name === 'JsonWebTokenError') {
    return new AppError('Token inválido', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return new AppError('Token expirado', 401);
  }

  // PostgreSQL: conexión caída y error de sintaxis en la consulta
  if (err.code === 'ECONNREFUSED') {
    return new AppError('Error de conexión a la base de datos', 500);
  }

  if (err.code === '42601') {
    return new AppError('Error en la consulta a la base de datos', 500);
  }

  // Violación de llave foránea
  if (err.code === '23503') {
    return new AppError('El registro referenciado no existe', 400);
  }

  return err;
};

/**
 * Último eslabón de la cadena: cualquier next(error) termina aquí.
 *
 * Antes armaba un objeto plano `{ success, message }` y se lo pasaba a
 * response.error, que al no encontrarle isOperational lo trataba como un
 * fallo inesperado. En producción eso convertía todo -- un 404 de ruta
 * inexistente, un 400 de validación -- en "Error interno del servidor".
 * Ahora se le pasa el error, que es quien sabe si es operacional.
 */
const errorHandler = (err, req, res, _next) => {
  debug('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  const error = traducirError(err);

  response.error(res, error, error.statusCode || 500);
};

// Middleware para rutas no encontradas
const notFound = (req, _res, next) => {
  const error = new AppError(`Ruta no encontrada: ${req.originalUrl}`, 404);
  next(error);
};

// Función para crear errores operacionales
const createError = (message, statusCode) => {
  return new AppError(message, statusCode);
};

module.exports = {
  AppError,
  errorHandler,
  notFound,
  createError,
  traducirError,
};
