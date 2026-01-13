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

// Middleware de manejo de errores
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log del error
  debug('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map(val => val.message)
      .join(', ');
    error = new AppError(message, 400);
  }

  // Error de duplicado en base de datos
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} ya existe`;
    error = new AppError(message, 400);
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Token inválido', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expirado', 401);
  }

  // Error de base de datos
  if (err.code === 'ECONNREFUSED') {
    error = new AppError('Error de conexión a la base de datos', 500);
  }

  // Error de sintaxis SQL
  if (err.code === '42601') {
    error = new AppError('Error en la consulta a la base de datos', 500);
  }

  // Respuesta del error
  const statusCode = error.statusCode || 500;
  const message = error.isOperational
    ? error.message
    : 'Error interno del servidor';

  // En desarrollo, incluir stack trace
  const errorResponse = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  response.error(res, errorResponse, statusCode);
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
};
