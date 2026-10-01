const {
  AppError,
  errorHandler,
  notFound,
  createError,
  traducirError,
} = require('../../src/middleware/errorHandler');

const crearRes = () => ({
  statusCode: null,
  body: null,
  status(codigo) {
    this.statusCode = codigo;
    return this;
  },
  json(cuerpo) {
    this.body = cuerpo;
    return this;
  },
});

const crearReq = () => ({
  url: '/api/comunicados/9',
  originalUrl: '/api/comunicados/9',
  method: 'GET',
  ip: '127.0.0.1',
  get: () => 'jest',
});

const enEntorno = (entorno, fn) => {
  const anterior = process.env.NODE_ENV;
  process.env.NODE_ENV = entorno;

  try {
    fn();
  } finally {
    process.env.NODE_ENV = anterior;
  }
};

describe('errorHandler', () => {
  it('respeta el código y el mensaje de un error operacional', () => {
    const res = crearRes();

    errorHandler(createError('Comunicado no encontrado', 404), crearReq(), res);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Comunicado no encontrado');
  });

  it('conserva el mensaje operacional también en producción', () => {
    const res = crearRes();

    enEntorno('production', () =>
      errorHandler(createError('El email ya está en uso', 409), crearReq(), res)
    );

    // El bug anterior devolvía 409 con "Error interno del servidor"
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe('El email ya está en uso');
  });

  it('oculta el detalle de un error inesperado en producción', () => {
    const res = crearRes();

    enEntorno('production', () =>
      errorHandler(
        new TypeError('Cannot read properties of undefined'),
        crearReq(),
        res
      )
    );

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Error interno del servidor');
  });

  it('en desarrollo muestra el detalle y el stack del error inesperado', () => {
    const res = crearRes();

    enEntorno('development', () =>
      errorHandler(new TypeError('algo raro pasó'), crearReq(), res)
    );

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('algo raro pasó');
    expect(res.body.stack).toBeDefined();
  });
});

describe('traducirError', () => {
  it('convierte la validación de Mongoose en un 400 legible', () => {
    const err = new Error('fallo');
    err.name = 'ValidationError';
    err.errors = {
      email: { message: 'Email inválido' },
      nombre: { message: 'Nombre requerido' },
    };

    const traducido = traducirError(err);

    expect(traducido.statusCode).toBe(400);
    expect(traducido.message).toBe('Email inválido, Nombre requerido');
    expect(traducido.isOperational).toBe(true);
  });

  it('traduce el duplicado de base de datos nombrando el campo', () => {
    const err = new Error('duplicate');
    err.code = 11000;
    err.keyValue = { email: 'ana@camintra.com' };

    expect(traducirError(err).message).toBe('email ya existe');
    expect(traducirError(err).statusCode).toBe(400);
  });

  it.each([
    ['JsonWebTokenError', 'Token inválido', 401],
    ['TokenExpiredError', 'Token expirado', 401],
  ])('traduce %s', (nombre, mensaje, codigo) => {
    const err = new Error('jwt');
    err.name = nombre;

    const traducido = traducirError(err);

    expect(traducido.message).toBe(mensaje);
    expect(traducido.statusCode).toBe(codigo);
  });

  it.each([
    ['ECONNREFUSED', 'Error de conexión a la base de datos', 500],
    ['42601', 'Error en la consulta a la base de datos', 500],
    ['23503', 'El registro referenciado no existe', 400],
  ])('traduce el código %s de PostgreSQL', (code, mensaje, codigo) => {
    const err = new Error('pg');
    err.code = code;

    const traducido = traducirError(err);

    expect(traducido.message).toBe(mensaje);
    expect(traducido.statusCode).toBe(codigo);
  });

  it('deja pasar sin tocar lo que no reconoce', () => {
    const err = new TypeError('boom');

    expect(traducirError(err)).toBe(err);
  });

  it('no confunde un ValidationError sin detalle de campos', () => {
    const err = new Error('vacío');
    err.name = 'ValidationError';

    // Antes hacía Object.values(undefined) y tumbaba el propio handler
    expect(() => traducirError(err)).not.toThrow();
  });
});

describe('notFound', () => {
  it('pasa un 404 con la ruta pedida', () => {
    const next = jest.fn();

    notFound({ originalUrl: '/api/no-existe' }, crearRes(), next);

    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(404);
    expect(error.message).toContain('/api/no-existe');
  });
});

describe('AppError', () => {
  it('marca como fail los 4xx y como error los 5xx', () => {
    expect(new AppError('x', 404).status).toBe('fail');
    expect(new AppError('x', 500).status).toBe('error');
  });

  it('nace operacional y con stack', () => {
    const error = new AppError('x', 400);

    expect(error.isOperational).toBe(true);
    expect(error.stack).toBeDefined();
  });
});
