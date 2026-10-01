const jwt = require('jsonwebtoken');
const config = require('../config/index');

/**
 * Único lugar donde se firman y verifican los JWT de la intranet.
 *
 * Antes había tres copias de esta lógica: Auth/services firmaba leyendo
 * process.env.JWT_SECRET, AuthServices.verifyToken verificaba sin issuer
 * ni audience, y el middleware authenticateToken lo hacía por su cuenta.
 * Si alguna de las tres se desincronizaba, los tokens emitidos dejaban de
 * validar en silencio.
 */
const EMISOR = {
  issuer: 'calendario-app',
  audience: 'calendario-users',
};

const firmar = payload =>
  jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
    ...EMISOR,
  });

const verificar = token => jwt.verify(token, config.jwtSecret, EMISOR);

module.exports = { firmar, verificar, EMISOR };
