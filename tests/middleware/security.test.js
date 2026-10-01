const express = require('express');
const request = require('supertest');
const { firmar } = require('../../src/common/tokens');
const {
  authenticateToken,
  authorizeRoles,
  soloAdmin,
  adminOEditor,
  createRateLimit,
  sanitizeLogs,
} = require('../../src/middleware/security');

// App mínima para probar un middleware aislado
const appCon = (...middlewares) => {
  const app = express();
  app.get('/privado', ...middlewares, (req, res) =>
    res.json({ ok: true, user: req.user })
  );

  return app;
};

describe('authenticateToken', () => {
  it('deja pasar con un token válido y llena req.user', async () => {
    const token = firmar({ id: 7, rol: 'editor' });

    const res = await request(appCon(authenticateToken))
      .get('/privado')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: 7, rol: 'editor' });
  });

  it('sin cabecera Authorization responde 401', async () => {
    const res = await request(appCon(authenticateToken)).get('/privado');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token de acceso requerido');
  });

  it('exige el esquema Bearer', async () => {
    const token = firmar({ id: 7 });

    const res = await request(appCon(authenticateToken))
      .get('/privado')
      .set('Authorization', `Basic ${token}`);

    expect(res.status).toBe(401);
  });

  it('con token basura responde 403', async () => {
    const res = await request(appCon(authenticateToken))
      .get('/privado')
      .set('Authorization', 'Bearer no-es-un-token');

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Token inválido o expirado');
  });

  it('rechaza un token firmado con otro secreto', async () => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: 7, rol: 'admin' }, 'secreto-del-atacante');

    const res = await request(appCon(authenticateToken))
      .get('/privado')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('rechaza un token expirado', async () => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: 7 }, process.env.JWT_SECRET, {
      expiresIn: '-1s',
      issuer: 'calendario-app',
      audience: 'calendario-users',
    });

    const res = await request(appCon(authenticateToken))
      .get('/privado')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('rechaza un token de otra aplicación que use el mismo secreto', async () => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: 7, rol: 'admin' }, process.env.JWT_SECRET, {
      issuer: 'otra-app',
      audience: 'otra-audiencia',
    });

    const res = await request(appCon(authenticateToken))
      .get('/privado')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

describe('authorizeRoles', () => {
  const comoRol = rol => (req, _res, next) => {
    req.user = { id: 1, rol };
    next();
  };

  it('deja pasar al rol permitido', async () => {
    const res = await request(
      appCon(comoRol('admin'), authorizeRoles('admin'))
    ).get('/privado');

    expect(res.status).toBe(200);
  });

  it('corta con 403 al rol no permitido', async () => {
    const res = await request(
      appCon(comoRol('colaborador'), authorizeRoles('admin'))
    ).get('/privado');

    expect(res.status).toBe(403);
    expect(res.body.message).toBe(
      'No tienes permisos para realizar esta acción'
    );
  });

  it('sin req.user responde 401, no 403', async () => {
    // Si se olvidó authenticateToken antes, el problema es de autenticación
    const res = await request(appCon(authorizeRoles('admin'))).get('/privado');

    expect(res.status).toBe(401);
  });

  it('soloAdmin no deja pasar al editor', async () => {
    const res = await request(appCon(comoRol('editor'), soloAdmin)).get(
      '/privado'
    );

    expect(res.status).toBe(403);
  });

  it.each(['admin', 'editor'])('adminOEditor deja pasar a %s', async rol => {
    const res = await request(appCon(comoRol(rol), adminOEditor)).get(
      '/privado'
    );

    expect(res.status).toBe(200);
  });

  it('adminOEditor no deja pasar al colaborador', async () => {
    const res = await request(appCon(comoRol('colaborador'), adminOEditor)).get(
      '/privado'
    );

    expect(res.status).toBe(403);
  });
});

describe('createRateLimit', () => {
  it('corta con 429 al pasarse del máximo', async () => {
    const limite = createRateLimit(60 * 1000, 2, 'Muchos intentos');
    const app = appCon(limite);

    await expect(request(app).get('/privado')).resolves.toMatchObject({
      status: 200,
    });
    await expect(request(app).get('/privado')).resolves.toMatchObject({
      status: 200,
    });

    const tercera = await request(app).get('/privado');
    expect(tercera.status).toBe(429);
    expect(tercera.body.message).toBe('Muchos intentos');
  });
});

describe('sanitizeLogs', () => {
  it('no rompe la respuesta que envuelve', async () => {
    const app = express();
    app.use(sanitizeLogs);
    app.get('/login', (req, res) =>
      res.json({ success: true, data: { token: 'abc' } })
    );

    const res = await request(app).get('/login');

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBe('abc');
  });
});
