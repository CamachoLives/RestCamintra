const { authRepository } = require('./repository');
const { UsersRepository } = require('../Users/repository');
const bcrypt = require('bcrypt');
const { firmar, verificar } = require('../common/tokens');
const { createError } = require('../middleware/errorHandler');
const config = require('../config/index');
const debug = require('debug')('app:auth-services');

// El teclado del movil capitaliza y el autocompletado deja espacios:
// el email se normaliza antes de buscar y antes de guardar.
const normalizarEmail = email =>
  String(email ?? '')
    .trim()
    .toLowerCase();

const Login = async (email, password) => {
  try {
    const user = await authRepository.findByEmail(normalizarEmail(email));

    if (!user) {
      throw createError('Credenciales inválidas', 401);
    }

    if (user.activo === false) {
      throw createError(
        'El usuario está inactivo, contacta al administrador',
        403
      );
    }

    if (!user.password_hash) {
      throw createError('El usuario no tiene contraseña registrada', 400);
    }

    // Verificar contraseña
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      throw createError('Credenciales inválidas', 401);
    }

    const token = firmar({
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol || 'colaborador',
    });

    // Sello de último acceso para el panel de administración
    await UsersRepository.updateUltimoAcceso(user.id);

    debug('Login successful for user:', user.email);

    return {
      message: 'Inicio de sesión exitoso',
      token: token,
      id: user.id,
      rol: user.rol || 'colaborador',
      nombre: user.nombre,
    };
  } catch (error) {
    debug('Login error:', error.message);
    throw error;
  }
};

const Register = async (nombre, email, password) => {
  try {
    // Verificar si el usuario ya existe
    const emailNormalizado = normalizarEmail(email);

    const exists = await authRepository.findByEmail(emailNormalizado);
    if (exists) {
      throw createError('El email ya está en uso', 409);
    }

    // Hash de la contraseña
    const saltRounds = config.bcryptRounds;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear nuevo usuario
    const newUser = await authRepository.create({
      nombre: nombre.trim(),
      email: emailNormalizado,
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
    return verificar(token);
  } catch {
    throw createError('Token inválido', 401);
  }
};

module.exports.AuthServices = {
  Login,
  Register,
  verifyToken,
};
