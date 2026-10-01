const { configuracionRepository } = require('./repository');
const { createError } = require('../middleware/errorHandler');
const debug = require('debug')('app:configuracion-service');

// Campos del formulario y el tipo con el que llegan a PostgreSQL
const CAMPOS = {
  logo: 'texto',
  favicon: 'texto',
  color: 'texto',
  path: 'texto',
  idioma: 'texto',
  sitionombre: 'texto',
  emailsoporte: 'texto',
  tiemposesion: 'entero',
  caducidad: 'entero',
  longitudminimapass: 'entero',
  maximointentos: 'entero',
  autenticacion: 'booleano',
  dashboard: 'booleano',
  carousel: 'booleano',
  Mantenimiento: 'booleano',
};

/**
 * El formulario manda todo como texto y los campos que el administrador no
 * toca llegan como ''. Un '' en una columna INTEGER hace que PostgreSQL
 * responda "invalid input syntax for type integer" y la pantalla terminaba
 * en un 500 sin explicación, así que aquí se convierten a null (dejar el
 * valor que ya tenía la columna).
 */
const normalizar = datos => {
  const limpio = {};

  for (const [campo, tipo] of Object.entries(CAMPOS)) {
    const valor = datos[campo];

    if (valor === undefined || valor === null || valor === '') {
      limpio[campo] = null;
      continue;
    }

    if (tipo === 'entero') {
      const numero = Number(valor);

      if (!Number.isInteger(numero) || numero < 0) {
        throw createError(`El campo ${campo} debe ser un número entero`, 400);
      }

      limpio[campo] = numero;
      continue;
    }

    if (tipo === 'booleano') {
      limpio[campo] = valor === true || valor === 'true' || valor === 'si';
      continue;
    }

    limpio[campo] = String(valor).trim();
  }

  return limpio;
};

const validar = datos => {
  if (!datos || Object.keys(datos).length === 0) {
    throw createError('Datos de parametrización requeridos', 400);
  }

  if (
    datos.emailsoporte &&
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(datos.emailsoporte)
  ) {
    throw createError('El email de soporte no tiene un formato válido', 400);
  }

  if (datos.color && !/^#?[0-9a-fA-F]{3,8}$/.test(datos.color)) {
    throw createError(
      'El color debe ser un hexadecimal, por ejemplo #1d4ed8',
      400
    );
  }
};

const obtener = async () => {
  try {
    return await configuracionRepository.obtener();
  } catch (error) {
    debug('Error obteniendo la parametrización:', error);
    throw createError('Error al obtener la parametrización', 500);
  }
};

const actualizar = async datos => {
  try {
    validar(datos);

    return await configuracionRepository.actualizar(normalizar(datos));
  } catch (error) {
    if (error.isOperational) throw error;

    debug('Error actualizando la parametrización:', error);
    throw createError('Error al actualizar la parametrización', 500);
  }
};

module.exports.configuracionService = {
  obtener,
  actualizar,
  normalizar,
};
