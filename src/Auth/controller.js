const debug = require('debug')('app:module-auth-controller');
const { AuthServices } = require('./services');
const { response } = require('../common/response');
const { createError } = require('../middleware/errorHandler');

module.exports.AuthController = {
  Login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      // Validación adicional de entradaa
      if (!email || !password) {
        throw createError('Email y contraseña son requeridos', 400);
      }
      const result = await AuthServices.Login(email, password);

      // No logear el token en producción
      if (process.env.NODE_ENV !== 'production') {
        debug('Login successful for user:', email);
      }

      response.success(res, result.message, 200, {
        token: result.token,
        id: result.id,
      });
    } catch (error) {
      next('Siguiente error --> ', error);
    }
  },

  Register: async (req, res, next) => {
    try {
      const { nombre, email, password } = req.body;

      // Validación adicional de entrada
      if (!nombre || !email || !password) {
        throw createError('Todos los campos son requeridos', 400);
      }

      const result = await AuthServices.Register(nombre, email, password);

      // No logear información sensible
      debug('User registered successfully:', { email, nombre });

      response.success(res, result.message, 201, {
        user: {
          id: result.user.id,
          nombre: result.user.nombre,
          email: result.user.email,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Nuevo endpoint para verificar token
  VerifyToken: (req, res, next) => {
    try {
      // Si llegamos aquí, el token es válido (verificado por middleware)
      response.success(res, 'Token válido', 200, {
        user: {
          id: req.user.id,
          email: req.user.email,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
