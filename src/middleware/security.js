const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const debug = require('debug')('app:security');

// Configuración de rate limiting
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || 'Demasiadas solicitudes, intenta más tarde',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Rate limit para autenticación (más restrictivo)
const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutos
  15, // máximo 15 intentos
  'Demasiados intentos de login, intenta en 15 minutos'
);

// Rate limit general
const generalRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutos
  100, // máximo 100 requests
  'Demasiadas solicitudes, intenta más tarde'
);

// Middleware de autenticación JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acceso requerido',
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      debug('Token verification failed:', err.message);
      return res.status(403).json({
        success: false,
        message: 'Token inválido o expirado',
      });
    }

    req.user = user;
    next();
  });
};

// Middleware para sanitizar logs (evitar logs de información sensible)
const sanitizeLogs = (req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    // No logear respuestas que contengan tokens o información sensible
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        if (parsed.token || parsed.password) {
          debug('Response contains sensitive data, not logging');
          return originalSend.call(this, data);
        }
      } catch (e) {
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
  authRateLimit,
  generalRateLimit,
  authenticateToken,
  sanitizeLogs,
  helmetConfig,
};
