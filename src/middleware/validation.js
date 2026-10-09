const Joi = require('joi');
const { validationResult } = require('express-validator');

// Esquemas de validación
const authSchemas = {
  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'El email debe tener un formato válido',
      'any.required': 'El email es requerido',
    }),
    // En el login no se exige longitud mínima: la política de
    // contraseñas se aplica al registrarse. Pedirla aquí devolvería un
    // 400 a quien tenga una clave antigua más corta, en vez del 401 que
    // corresponde.
    password: Joi.string().required().messages({
      'any.required': 'La contraseña es requerida',
    }),
  }),

  register: Joi.object({
    nombre: Joi.string().min(2).max(50).required().messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede exceder 50 caracteres',
      'any.required': 'El nombre es requerido',
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'El email debe tener un formato válido',
      'any.required': 'El email es requerido',
    }),
    password: Joi.string()
      .min(6)
      .max(100)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'La contraseña debe tener al menos 6 caracteres',
        'string.max': 'La contraseña no puede exceder 100 caracteres',
        'string.pattern.base':
          'La contraseña debe contener al menos una letra minúscula, una mayúscula y un número',
        'any.required': 'La contraseña es requerida',
      }),
  }),
};

// Middleware de validación
const validateRequest = schema => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors,
      });
    }

    next();
  };
};

// Middleware para manejar errores de express-validator
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors: errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
      })),
    });
  }
  next();
};

module.exports = {
  authSchemas,
  validateRequest,
  handleValidationErrors,
};
