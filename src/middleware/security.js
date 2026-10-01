const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const debug = require('debug')('app:security');
const { verificar } = require('../common/tokens');
const { RATE_LIMITS, ERROR_MESSAGES } = require('../constants/index');

// Configuración de rate limiting
const createRateLimit = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || 'Demasiadas solicitudes, intenta más tarde',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

// Rate limit para autenticación (más restrictivo).
// Los límites viven en constants para que no haya dos números distintos
// documentados y aplicados.
const authRateLimit = createRateLimit(
  RATE_LIMITS.AUTH_WINDOW_MS,
  RATE_LIMITS.AUTH_MAX_ATTEMPTS,
  'Demasiados intentos de login, intenta en 15 minutos'
);

// Rate limit general
const generalRateLimit = createRateLimit(
  RATE_LIMITS.GENERAL_WINDOW_MS,
  RATE_LIMITS.GENERAL_MAX_REQUESTS,
  'Demasiadas solicitudes, intenta más tarde'
);

// Middleware de autenticación JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || '';
  const [esquema, token] = authHeader.split(' ');

  if (!token || esquema !== 'Bearer') {
    return res.status(401).json({
      success: false,
      message: ERROR_MESSAGES.TOKEN_REQUIRED,
    });
  }

  try {
    req.user = verificar(token);
    next();
  } catch (error) {
    debug('Token verification failed:', error.message);
    return res.status(403).json({
      success: false,
      message: ERROR_MESSAGES.TOKEN_INVALID,
    });
  }
};

// Middleware de autorización por rol.
// Se usa siempre DESPUÉS de authenticateToken, que es quien llena req.user.
const authorizeRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.TOKEN_REQUIRED,
      });
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      debug('Access denied for role:', req.user.rol);
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción',
      });
    }

    next();
  };
};

// Atajos para los dos casos más comunes de la intranet
const soloAdmin = authorizeRoles('admin');
const adminOEditor = authorizeRoles('admin', 'editor');

// Middleware para sanitizar logs (evitar logs de información sensible)
const sanitizeLogs = (req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    // No logear respuestas que contengan tokens o información sensible
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        if (parsed.token || parsed.password || parsed.data?.token) {
          debug('Response contains sensitive data, not logging');
          return originalSend.call(this, data);
        }
      } catch {
        // Si no es JSON, continuar normalmente
      }
    }

    debug('Response:', data);
    return originalSend.call(this, data);
  };

  next();
};

// Configuración de Helmet para headers de seguridad
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
});

module.exports = {
  createRateLimit,
  authRateLimit,
  generalRateLimit,
  authenticateToken,
  authorizeRoles,
  soloAdmin,
  adminOEditor,
  sanitizeLogs,
  helmetConfig,
};
