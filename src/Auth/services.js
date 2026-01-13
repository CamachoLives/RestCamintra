const { authRepository } = require('./repository');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createError } = require('../middleware/errorHandler');
const debug = require('debug')('app:auth-services');

const { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_ROUNDS } = process.env;

const Login = async (email, password) => {
  try {
    // Buscar usuario por email
    const user = await authRepository.findByEmail(email);
    //console.log("Pass has --> ", user.password);

    if (!user) {
      throw createError('Credenciales inválidas', 401);
    }

    if (!user.password_hash) {
      throw createError('El usuario no tiene contraseña registrada', 400);
    }
    
    // Verificar contraseña
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      throw createError('Credenciales inválidas', 401);
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN || '1h',
        issuer: 'calendario-app',
        audience: 'calendario-users',
      }
    );

    debug('Login successful for user:', user.email);

    return {
      message: 'Inicio de sesión exitoso',
      token: token,
      id: user.id,
    };
  } catch (error) {
    debug('Login error:', error.message);
    throw error;
  }
};

const Register = async (nombre, email, password) => {
  try {
    // Verificar si el usuario ya existe
    const exists = await authRepository.findByEmail(email);
    if (exists) {
      throw createError('El email ya está en uso', 409);
    }

    // Hash de la contraseña
    const saltRounds = parseInt(BCRYPT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear nuevo usuario
    const newUser = await authRepository.create({
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    debug('User registered successfully:', newUser.email);

    return {
      message: 'Usuario creado exitosamente',
      user: {
        id: newUser.id,
        nombre: newUser.nombre,
        email: newUser.email,
      },
    };
  } catch (error) {
    debug('Registration error:', error.message);
    throw error;
  }
};

// Función para verificar token (útil para middleware)
const verifyToken = token => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    throw createError('Token inválido', 401);
  }
};

module.exports.AuthServices = {
  Login,
  Register,
  verifyToken,
};
