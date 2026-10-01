const { response } = require('../../src/common/response');
const { AppError } = require('../../src/middleware/errorHandler');

// Doble de res que guarda lo último que se envió
const crearRes = () => {
  const res = {
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
  };

  return res;
};

describe('response.success', () => {
  it('responde 200 con el sobre { success, message, timestamp }', () => {
    const res = crearRes();

    response.success(res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: 'Operación exitosa',
    });
    expect(Date.parse(res.body.timestamp)).not.toBeNaN();
  });

  it('incluye data cuando se pasa', () => {
    const res = crearRes();

    response.success(res, 'Listo', 201, { id: 7 });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toEqual({ id: 7 });
  });

  it('omite data cuando no hay nada que devolver', () => {
    const res = crearRes();

    response.success(res, 'Eliminado', 200);

    expect(res.body).not.toHaveProperty('data');
  });

  it('deja pasar las listas vacías, que son un dato válido', () => {
    const res = crearRes();

    response.success(res, 'Sin resultados', 200, []);

    expect(res.body.data).toEqual([]);
  });
});

describe('response.error', () => {
  it('respeta el mensaje y el código de un error operacional', () => {
    const res = crearRes();

    response.error(res, new AppError('Comunicado no encontrado', 404));

    expect(res.statusCode).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      message: 'Comunicado no encontrado',
    });
  });

  it('sin error devuelve un 500 genérico', () => {
    const res = crearRes();

    response.error(res);

    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
  });

  it('oculta el detalle de los errores inesperados en producción', () => {
    const res = crearRes();
    const anterior = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      response.error(res, new Error('select * from usuarios -- sintaxis'));
    } finally {
      process.env.NODE_ENV = anterior;
    }

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Error interno del servidor');
    expect(res.body).not.toHaveProperty('stack');
  });
});

describe('atajos de error', () => {
  it.each([
    ['unauthorized', 401, 'No autorizado'],
    ['forbidden', 403, 'Acceso denegado'],
    ['notFound', 404, 'Recurso no encontrado'],
  ])('%s responde %i', (metodo, codigo, mensaje) => {
    const res = crearRes();

    response[metodo](res);

    expect(res.statusCode).toBe(codigo);
    expect(res.body).toMatchObject({ success: false, message: mensaje });
  });

  it('validationError lista los campos inválidos', () => {
    const res = crearRes();
    const errores = [{ field: 'email', message: 'Email inválido' }];

    response.validationError(res, errores);

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(errores);
  });
});
