jest.mock('../../src/Users/repository', () => ({
  UsersRepository: {
    getAllUsers: jest.fn(),
    contarUsuarios: jest.fn(),
    getUserById: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  },
}));

const express = require('express');
const request = require('supertest');
const { UsersRepository } = require('../../src/Users/repository');
const { Users } = require('../../src/Users/index');
const { firmar } = require('../../src/common/tokens');
const { errorHandler, notFound } = require('../../src/middleware/errorHandler');

const tokenDe = rol => firmar({ id: 1, nombre: 'Quien sea', rol });

const usuario = {
  id: 7,
  nombre: 'Ana Ruiz',
  email: 'ana@camintra.com',
  rol: 'editor',
  activo: true,
};

let app;

beforeEach(() => {
  app = express();
  app.use(express.json());
  Users(app);
  app.use(notFound);
  app.use(errorHandler);

  UsersRepository.getAllUsers.mockResolvedValue([usuario]);
  UsersRepository.contarUsuarios.mockResolvedValue(1);
});

describe('GET /api/users', () => {
  it('el administrador recibe el listado paginado', async () => {
    UsersRepository.contarUsuarios.mockResolvedValue(42);

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${tokenDe('admin')}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ total: 42, page: 1, limit: 10 });
    expect(res.body.data.items.length).toBe(1);
  });

  it.each(['editor', 'colaborador'])(
    'un %s no puede listar los correos de toda la empresa',
    async rol => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${tokenDe(rol)}`);

      // Para eso esta /api/directorio
      expect(res.status).toBe(403);
      expect(UsersRepository.getAllUsers).not.toHaveBeenCalled();
    }
  );

  it('sin token responde 401', async () => {
    const res = await request(app).get('/api/users');

    expect(res.status).toBe(401);
  });

  it('pasa los filtros de la query al servicio', async () => {
    await request(app)
      .get('/api/users?email=ana&rol=editor&page=2&limit=5')
      .set('Authorization', `Bearer ${tokenDe('admin')}`);

    expect(UsersRepository.getAllUsers).toHaveBeenCalledWith({
      email: 'ana',
      rol: 'editor',
      page: 2,
      limit: 5,
    });
  });

  it('nunca aparece un hash en la respuesta', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${tokenDe('admin')}`);

    expect(JSON.stringify(res.body)).not.toContain('$2b$');
    expect(JSON.stringify(res.body)).not.toContain('password');
  });
});

describe('GET /api/users/me', () => {
  it('cualquier usuario autenticado consulta sus propios datos', async () => {
    UsersRepository.getUserById.mockResolvedValue(usuario);

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${tokenDe('colaborador')}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: 7 });
  });

  it('si el usuario del token ya no existe responde 404', async () => {
    UsersRepository.getUserById.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${tokenDe('colaborador')}`);

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/users/:id', () => {
  it('solo el administrador cambia el rol de alguien', async () => {
    const res = await request(app)
      .put('/api/users/7')
      .set('Authorization', `Bearer ${tokenDe('editor')}`)
      .send({ rol: 'admin' });

    expect(res.status).toBe(403);
    expect(UsersRepository.updateUser).not.toHaveBeenCalled();
  });

  it('el administrador actualiza', async () => {
    UsersRepository.updateUser.mockResolvedValue({ ...usuario, rol: 'admin' });

    const res = await request(app)
      .put('/api/users/7')
      .set('Authorization', `Bearer ${tokenDe('admin')}`)
      .send({ rol: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.data.rol).toBe('admin');
  });

  it('no deja cambiar la contraseña por esta via', async () => {
    UsersRepository.updateUser.mockResolvedValue(usuario);

    await request(app)
      .put('/api/users/7')
      .set('Authorization', `Bearer ${tokenDe('admin')}`)
      .send({ nombre: 'Ana R.', password: 'nueva-clave' });

    expect(UsersRepository.updateUser.mock.calls[0][1]).not.toHaveProperty(
      'password'
    );
  });

  it('con cuerpo vacío responde 400', async () => {
    const res = await request(app)
      .put('/api/users/7')
      .set('Authorization', `Bearer ${tokenDe('admin')}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/users/:id', () => {
  it('es una baja lógica y solo del administrador', async () => {
    UsersRepository.deleteUser.mockResolvedValue(true);

    const res = await request(app)
      .delete('/api/users/7')
      .set('Authorization', `Bearer ${tokenDe('admin')}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('desactivado');
  });

  it('un editor no desactiva usuarios', async () => {
    const res = await request(app)
      .delete('/api/users/7')
      .set('Authorization', `Bearer ${tokenDe('editor')}`);

    expect(res.status).toBe(403);
  });

  it('con un id inexistente responde 404', async () => {
    UsersRepository.deleteUser.mockResolvedValue(false);

    const res = await request(app)
      .delete('/api/users/99')
      .set('Authorization', `Bearer ${tokenDe('admin')}`);

    expect(res.status).toBe(404);
  });
});
