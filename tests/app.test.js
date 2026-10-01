jest.mock('../src/database/index', () => ({ query: jest.fn() }));

const request = require('supertest');
const { crearApp } = require('../src/app');

const app = crearApp();

describe('GET /health', () => {
  it('responde 200 con la hora del servidor', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Date.parse(res.body.timestamp)).not.toBeNaN();
  });

  it('no pide autenticación: la usa el monitoreo', async () => {
    const res = await request(app).get('/health');

    expect(res.status).not.toBe(401);
  });
});

describe('rutas desconocidas', () => {
  it('responden 404 con el sobre de la API, no con el HTML de Express', async () => {
    const res = await request(app).get('/api/no-existe');

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false });
    expect(res.body.message).toContain('/api/no-existe');
  });
});

describe('cabeceras de seguridad', () => {
  it('helmet está activo', async () => {
    const res = await request(app).get('/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeDefined();
  });

  it('no delata la tecnología del servidor', async () => {
    const res = await request(app).get('/health');

    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('montaje de los módulos', () => {
  // Si un módulo no está montado la ruta devuelve 404; montada y sin
  // token devuelve 401, que es justo lo que se quiere comprobar.
  it.each([
    ['/api/users', 401],
    ['/api/parametrizacion/plataforma', 401],
    ['/api/comunicados', 401],
    ['/api/eventos', 401],
    ['/api/documentos', 401],
    ['/api/directorio', 401],
    ['/api/notificaciones', 401],
  ])('%s está montado y protegido', async (ruta, esperado) => {
    const res = await request(app).get(ruta);

    expect(res.status).toBe(esperado);
  });

  it('/api/auth/login existe y rechaza el cuerpo vacío', async () => {
    const res = await request(app).post('/api/auth/login').send({});

    expect(res.status).toBe(400);
  });
});
