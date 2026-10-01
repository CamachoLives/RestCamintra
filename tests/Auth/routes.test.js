jest.mock('../../src/Auth/repository', () => ({
  authRepository: { findByEmail: jest.fn(), create: jest.fn() },
}));
jest.mock('../../src/Users/repository', () => ({
  UsersRepository: { updateUltimoAcceso: jest.fn() },
}));

const express = require('express');
const request = require('supertest');
const bcrypt = require('bcrypt');
const { authRepository } = require('../../src/Auth/repository');
const { Auth } = require('../../src/Auth/index');
const { errorHandler, notFound } = require('../../src/middleware/errorHandler');

const PASSWORD = 'Secreta123';
let hash;
let app;

beforeAll(async () => {
  hash = await bcrypt.hash(PASSWORD, 4);
});

beforeEach(() => {
  app = express();
  app.use(express.json());
  Auth(app);
  app.use(notFound);
  app.use(errorHandler);
});

const usuarioActivo = {
  id: 7,
  nombre: 'Ana Ruiz',
  email: 'ana@camintra.com',
  rol: 'editor',
  activo: true,
};

describe('POST /api/auth/login', () => {
  it('devuelve token, id, nombre y rol', async () => {
    authRepository.findByEmail.mockResolvedValue({
      ...usuarioActivo,
      password_hash: hash,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ana@camintra.com', password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      id: 7,
      nombre: 'Ana Ruiz',
      rol: 'editor',
    });
    expect(res.body.data.token).toEqual(expect.any(String));
  });

  it('nunca devuelve el hash de la contraseña', async () => {
    authRepository.findByEmail.mockResolvedValue({
      ...usuarioActivo,
      password_hash: hash,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ana@camintra.com', password: PASSWORD });

    expect(JSON.stringify(res.body)).not.toContain('$2b$');
  });

  it('con cuerpo vacío responde 400 y no consulta la base', async () => {
    const res = await request(app).post('/api/auth/login').send({});

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'email' }),
        expect.objectContaining({ field: 'password' }),
      ])
    );
    expect(authRepository.findByEmail).not.toHaveBeenCalled();
  });

  it('con email mal formado responde 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'no-es-un-email', password: PASSWORD });

    expect(res.status).toBe(400);
    expect(authRepository.findByEmail).not.toHaveBeenCalled();
  });

  it('ignora los campos de más que mande el cliente', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ana@camintra.com', password: PASSWORD, rol: 'admin' });

    // No se acepta que el cliente proponga su propio rol
    expect(res.status).toBe(400);
  });

  it('acepta una contraseña corta y responde 401, no 400', async () => {
    // La política de longitud es del registro: a quien tenga una clave
    // antigua de 4 caracteres le corresponde un 401, no un error de forma
    authRepository.findByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ana@camintra.com', password: 'ab12' });

    expect(res.status).toBe(401);
  });

  it('con credenciales incorrectas responde 401', async () => {
    authRepository.findByEmail.mockResolvedValue({
      ...usuarioActivo,
      password_hash: hash,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ana@camintra.com', password: 'otra-clave' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Credenciales inválidas');
  });

  it('al usuario inactivo le responde 403 explicando el motivo', async () => {
    authRepository.findByEmail.mockResolvedValue({
      ...usuarioActivo,
      activo: false,
      password_hash: hash,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ana@camintra.com', password: PASSWORD });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('inactivo');
  });
});

describe('POST /api/auth/register', () => {
  it('exige una contraseña con mayúscula, minúscula y número', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Ana', email: 'ana@camintra.com', password: 'simple' });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('password');
  });

  it('crea el usuario y devuelve 201 sin datos sensibles', async () => {
    authRepository.findByEmail.mockResolvedValue(null);
    authRepository.create.mockResolvedValue({
      id: 11,
      nombre: 'Ana',
      email: 'ana@camintra.com',
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Ana', email: 'ana@camintra.com', password: PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body.data.user).toEqual({
      id: 11,
      nombre: 'Ana',
      email: 'ana@camintra.com',
    });
    expect(JSON.stringify(res.body)).not.toContain(PASSWORD);
  });

  it('con email repetido responde 409', async () => {
    authRepository.findByEmail.mockResolvedValue(usuarioActivo);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Ana', email: 'ana@camintra.com', password: PASSWORD });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('El email ya está en uso');
  });
});

describe('GET /api/auth/verify', () => {
  it('sin token responde 401', async () => {
    const res = await request(app).get('/api/auth/verify');

    expect(res.status).toBe(401);
  });

  it('con token válido devuelve el usuario del token', async () => {
    const { firmar } = require('../../src/common/tokens');
    const token = firmar({
      id: 7,
      email: 'ana@camintra.com',
      nombre: 'Ana Ruiz',
      rol: 'editor',
    });

    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ id: 7, rol: 'editor' });
  });
});
