jest.mock('../../src/Users/repository', () => ({
  UsersRepository: {
    getAllUsers: jest.fn(),
    contarUsuarios: jest.fn(),
    getUserById: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  },
}));

const { UsersRepository } = require('../../src/Users/repository');
const { usersService } = require('../../src/Users/services');

const usuario = (extra = {}) => ({
  id: 7,
  nombre: 'Ana Ruiz',
  email: 'ana@camintra.com',
  rol: 'editor',
  activo: true,
  ...extra,
});

beforeEach(() => {
  UsersRepository.getAllUsers.mockResolvedValue([]);
  UsersRepository.contarUsuarios.mockResolvedValue(0);
});

describe('usersService.getAllUsers', () => {
  it('devuelve el sobre paginado, no un array pelado', async () => {
    UsersRepository.getAllUsers.mockResolvedValue([usuario()]);
    UsersRepository.contarUsuarios.mockResolvedValue(42);

    const resultado = await usersService.getAllUsers({ limit: 10 });

    expect(resultado).toMatchObject({
      total: 42,
      page: 1,
      limit: 10,
      totalPaginas: 5,
    });
    expect(resultado.items.length).toBe(1);
  });

  it('cuenta con los mismos filtros con los que lista', async () => {
    await usersService.getAllUsers({ email: 'ana', rol: 'admin' });

    expect(UsersRepository.contarUsuarios).toHaveBeenCalledWith({
      email: 'ana',
      rol: 'admin',
    });
    expect(UsersRepository.getAllUsers).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ana', rol: 'admin' })
    );
  });

  it('no deja pedir más de MAX_LIMIT de una vez', async () => {
    await usersService.getAllUsers({ limit: 10000 });

    expect(UsersRepository.getAllUsers.mock.calls[0][0].limit).toBe(100);
  });

  it('una página negativa se trata como la primera', async () => {
    await usersService.getAllUsers({ page: -5 });

    expect(UsersRepository.getAllUsers.mock.calls[0][0].page).toBe(1);
  });

  it('con texto en la paginación usa el valor por defecto, no NaN', async () => {
    await usersService.getAllUsers({ page: 'dos', limit: 'diez' });

    expect(UsersRepository.getAllUsers.mock.calls[0][0]).toMatchObject({
      page: 1,
      limit: 10,
    });
  });

  it('sin usuarios devuelve una página, no cero', async () => {
    await expect(usersService.getAllUsers()).resolves.toMatchObject({
      total: 0,
      totalPaginas: 1,
    });
  });

  it('un fallo de la base sale como 500 operacional', async () => {
    UsersRepository.contarUsuarios.mockRejectedValue(new Error('timeout'));

    await expect(usersService.getAllUsers()).rejects.toMatchObject({
      statusCode: 500,
      isOperational: true,
    });
  });
});

describe('usersService.getUserById', () => {
  it('devuelve el usuario', async () => {
    UsersRepository.getUserById.mockResolvedValue(usuario());

    await expect(usersService.getUserById(7)).resolves.toMatchObject({ id: 7 });
  });

  it('sin id responde 400', async () => {
    await expect(usersService.getUserById(undefined)).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(UsersRepository.getUserById).not.toHaveBeenCalled();
  });

  it('con un id inexistente devuelve null para que el controlador haga el 404', async () => {
    UsersRepository.getUserById.mockResolvedValue(null);

    await expect(usersService.getUserById(99)).resolves.toBeNull();
  });
});

describe('usersService.updateUser', () => {
  it('actualiza y devuelve el usuario', async () => {
    UsersRepository.updateUser.mockResolvedValue(usuario({ rol: 'admin' }));

    await expect(
      usersService.updateUser(7, { rol: 'admin' })
    ).resolves.toMatchObject({ rol: 'admin' });
  });

  it('sin datos responde 400', async () => {
    await expect(usersService.updateUser(7, {})).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(UsersRepository.updateUser).not.toHaveBeenCalled();
  });

  it('sin id responde 400', async () => {
    await expect(
      usersService.updateUser(null, { rol: 'admin' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('usersService.deleteUser', () => {
  it('desactiva al usuario', async () => {
    UsersRepository.deleteUser.mockResolvedValue(true);

    await expect(usersService.deleteUser(7)).resolves.toBe(true);
  });

  it('con un id inexistente devuelve false', async () => {
    UsersRepository.deleteUser.mockResolvedValue(false);

    await expect(usersService.deleteUser(99)).resolves.toBe(false);
  });

  it('sin id responde 400', async () => {
    await expect(usersService.deleteUser(undefined)).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});
