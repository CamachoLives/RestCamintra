const Joi = require('joi');
const { validationResult } = require('express-validator');

// Esquemas de validación
const authSchemas = {
  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'El email debe tener un formato válido',
      'any.required': 'El email es requerido',
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'La contraseña debe tener al menos 6 caracteres',
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

const profileSchemas = {
  createProfile: Joi.object({
    userId: Joi.string().required().messages({
      'any.required': 'El ID de usuario es requerido',
    }),
    biografia: Joi.string().max(500).allow('').messages({
      'string.max': 'La biografía no puede exceder 500 caracteres',
    }),
    area: Joi.string().max(100).required().messages({
      'string.max': 'El área no puede exceder 100 caracteres',
      'any.required': 'El área es requerida',
    }),
    telefono: Joi.string()
      .pattern(/^[0-9+\-\s()]+$/)
      .max(20)
      .allow('')
      .messages({
        'string.pattern.base': 'El teléfono debe tener un formato válido',
        'string.max': 'El teléfono no puede exceder 20 caracteres',
      }),
    ubicacion: Joi.string().max(100).allow('').messages({
      'string.max': 'La ubicación no puede exceder 100 caracteres',
    }),
    sitioWeb: Joi.string().uri().allow('').messages({
      'string.uri': 'El sitio web debe ser una URL válida',
    }),
    redesSociales: Joi.object({
      linkedin: Joi.string().uri().allow(''),
      twitter: Joi.string().uri().allow(''),
      github: Joi.string().uri().allow(''),
    }).optional(),
  }),

  updateProfile: Joi.object({
    biografia: Joi.string().max(500).allow('').messages({
      'string.max': 'La biografía no puede exceder 500 caracteres',
    }),
    area: Joi.string().max(100).messages({
      'string.max': 'El área no puede exceder 100 caracteres',
    }),
    telefono: Joi.string()
      .pattern(/^[0-9+\-\s()]+$/)
      .max(20)
      .allow('')
      .messages({
        'string.pattern.base': 'El teléfono debe tener un formato válido',
        'string.max': 'El teléfono no puede exceder 20 caracteres',
      }),
    ubicacion: Joi.string().max(100).allow('').messages({
      'string.max': 'La ubicación no puede exceder 100 caracteres',
    }),
    sitioWeb: Joi.string().uri().allow('').messages({
      'string.uri': 'El sitio web debe ser una URL válida',
    }),
    redesSociales: Joi.object({
      linkedin: Joi.string().uri().allow(''),
      twitter: Joi.string().uri().allow(''),
      github: Joi.string().uri().allow(''),
    }).optional(),
  }),

  uploadImage: Joi.object({
    userId: Joi.string().required().messages({
      'any.required': 'El ID de usuario es requerido',
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
  profileSchemas,
  validateRequest,
  handleValidationErrors,
};
