// Constantes de la aplicación
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

const ERROR_MESSAGES = {
  // Autenticación
  INVALID_CREDENTIALS: 'Credenciales inválidas',
  TOKEN_REQUIRED: 'Token de acceso requerido',
  TOKEN_INVALID: 'Token inválido o expirado',
  UNAUTHORIZED: 'No autorizado',

  // Validación
  REQUIRED_FIELD: 'Campo requerido',
  INVALID_EMAIL: 'Email inválido',
  INVALID_PASSWORD: 'Contraseña inválida',
  INVALID_ID: 'ID inválido',

  // Recursos
  USER_NOT_FOUND: 'Usuario no encontrado',
  ACTIVITY_NOT_FOUND: 'Actividad no encontrada',
  RESOURCE_NOT_FOUND: 'Recurso no encontrado',

  // Base de datos
  DATABASE_ERROR: 'Error de base de datos',
  CONNECTION_ERROR: 'Error de conexión',

  // General
  INTERNAL_ERROR: 'Error interno del servidor',
  VALIDATION_ERROR: 'Error de validación',
};

const SUCCESS_MESSAGES = {
  // Autenticación
  LOGIN_SUCCESS: 'Inicio de sesión exitoso',
  REGISTER_SUCCESS: 'Usuario registrado exitosamente',
  LOGOUT_SUCCESS: 'Sesión cerrada exitosamente',

  // CRUD
  CREATED: 'Recurso creado exitosamente',
  UPDATED: 'Recurso actualizado exitosamente',
  DELETED: 'Recurso eliminado exitosamente',
  RETRIEVED: 'Recurso obtenido exitosamente',

  // General
  OPERATION_SUCCESS: 'Operación exitosa',
};

const COLLECTIONS = {
  USERS: 'users',
  ACTIVITIES: 'activities',
  CALENDAR: 'calendar',
  NOTIFICATIONS: 'notifications',
};

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 100,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  EMAIL_MAX_LENGTH: 255,
};

const RATE_LIMITS = {
  AUTH_WINDOW_MS: 15 * 60 * 1000, // 15 minutos
  AUTH_MAX_ATTEMPTS: 5,
  GENERAL_WINDOW_MS: 15 * 60 * 1000, // 15 minutos
  GENERAL_MAX_REQUESTS: 100,
};

module.exports = {
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  COLLECTIONS,
  PAGINATION,
  VALIDATION,
  RATE_LIMITS,
};
