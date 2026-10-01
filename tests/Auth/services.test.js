jest.mock('../../src/Auth/repository', () => ({
  authRepository: { findByEmail: jest.fn(), create: jest.fn() },
}));
jest.mock('../../src/Users/repository', () => ({
  UsersRepository: { updateUltimoAcceso: jest.fn() },
}));

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authRepository } = require('../../src/Auth/repository');
const { UsersRepository } = require('../../src/Users/repository');
const { AuthServices } = require('../../src/Auth/services');

const PASSWORD = 'Secreta123';
let hash;

beforeAll(async () => {
  hash = await bcrypt.hash(PASSWORD, 4);
});

const usuario = (extra = {}) => ({
  id: 7,
  nombre: 'Ana Ruiz',
  email: 'ana@camintra.com',
  rol: 'editor',
  activo: true,
  password_hash: hash,
  ...extra,
});

describe('AuthServices.Login', () => {
  it('devuelve token y datos mínimos del usuario', async () => {
    authRepository.findByEmail.mockResolvedValue(usuario());

    const resultado = await AuthServices.Login('ana@camintra.com', PASSWORD);

    expect(resultado).toMatchObject({
      id: 7,
      nombre: 'Ana Ruiz',
      rol: 'editor',
    });
    expect(resultado.token).toEqual(expect.any(String));
    expect(resultado).not.toHaveProperty('password_hash');
  });

  it('normaliza el email antes de buscarlo', async () => {
    authRepository.findByEmail.mockResolvedValue(usuario());

    await expect(
      AuthServices.Login('  Ana@Camintra.COM ', PASSWORD)
    ).resolves.toMatchObject({ id: 7 });
    expect(authRepository.findByEmail).toHaveBeenCalledWith('ana@camintra.com');
  });

  it('firma el token con el rol, que es lo que leen los guards', async () => {
    authRepository.findByEmail.mockResolvedValue(usuario());

    const { token } = await AuthServices.Login('ana@camintra.com', PASSWORD);
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'calendario-app',
      audience: 'calendario-users',
    });

    expect(payload).toMatchObject({
      id: 7,
      email: 'ana@camintra.com',
      rol: 'editor',
    });
    expect(payload).not.toHaveProperty('password_hash');
  });

  it('a quien no tiene rol lo trata como colaborador', async () => {
    authRepository.findByEmail.mockResolvedValue(usuario({ rol: null }));

    const { rol } = await AuthServices.Login('ana@camintra.com', PASSWORD);

    expect(rol).toBe('colaborador');
  });

  it('sella el último acceso para el panel de administración', async () => {
    authRepository.findByEmail.mockResolvedValue(usuario());

    await AuthServices.Login('ana@camintra.com', PASSWORD);

    expect(UsersRepository.updateUltimoAcceso).toHaveBeenCalledWith(7);
  });

  it('con email inexistente responde 401 sin delatar el motivo', async () => {
    authRepository.findByEmail.mockResolvedValue(null);

    await expect(
      AuthServices.Login('nadie@camintra.com', PASSWORD)
    ).rejects.toMatchObject({
      message: 'Credenciales inválidas',
      statusCode: 401,
    });
  });

  it('con contraseña incorrecta da el mismo mensaje que con email inexistente', async () => {
    authRepository.findByEmail.mockResolvedValue(usuario());

    await expect(
      AuthServices.Login('ana@camintra.com', 'otra-clave')
    ).rejects.toMatchObject({
      message: 'Credenciales inválidas',
      statusCode: 401,
    });
  });

  it('al usuario inactivo le explica que hable con el administrador', async () => {
    authRepository.findByEmail.mockResolvedValue(usuario({ activo: false }));

    await expect(
      AuthServices.Login('ana@camintra.com', PASSWORD)
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('no intenta comparar si el usuario no tiene contraseña registrada', async () => {
    authRepository.findByEmail.mockResolvedValue(
      usuario({ password_hash: null })
    );

    await expect(
      AuthServices.Login('ana@camintra.com', PASSWORD)
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('AuthServices.Register', () => {
  it('guarda el email en minúsculas y el nombre sin espacios sobrantes', async () => {
    authRepository.findByEmail.mockResolvedValue(null);
    authRepository.create.mockImplementation(datos =>
      Promise.resolve({
        id: 11,
        ...datos,
      })
    );

    const resultado = await AuthServices.Register(
      '  Ana Ruiz  ',
      '  Ana@Camintra.COM ',
      PASSWORD
    );

    const guardado = authRepository.create.mock.calls[0][0];
    expect(guardado.nombre).toBe('Ana Ruiz');
    expect(guardado.email).toBe('ana@camintra.com');
    expect(resultado.user).toMatchObject({ id: 11 });
  });

  it('nunca guarda la contraseña en claro', async () => {
    authRepository.findByEmail.mockResolvedValue(null);
    authRepository.create.mockImplementation(datos =>
      Promise.resolve({
        id: 11,
        ...datos,
      })
    );

    await AuthServices.Register('Ana', 'ana@camintra.com', PASSWORD);

    const guardado = authRepository.create.mock.calls[0][0];
    expect(guardado.password).not.toBe(PASSWORD);
    await expect(bcrypt.compare(PASSWORD, guardado.password)).resolves.toBe(
      true
    );
  });

  it('rechaza el email repetido aunque cambie el uso de mayúsculas', async () => {
    authRepository.findByEmail.mockResolvedValue(usuario());

    await expect(
      AuthServices.Register('Ana', 'ANA@camintra.com', PASSWORD)
    ).rejects.toMatchObject({
      message: 'El email ya está en uso',
      statusCode: 409,
    });
    expect(authRepository.findByEmail).toHaveBeenCalledWith('ana@camintra.com');
    expect(authRepository.create).not.toHaveBeenCalled();
  });
});

describe('AuthServices.verifyToken', () => {
  it('devuelve el payload de un token válido', () => {
    const token = jwt.sign({ id: 7 }, process.env.JWT_SECRET);

    expect(AuthServices.verifyToken(token)).toMatchObject({ id: 7 });
  });

  it('rechaza un token firmado con otro secreto', () => {
    const token = jwt.sign({ id: 7 }, 'otro-secreto');

    expect(() => AuthServices.verifyToken(token)).toThrow('Token inválido');
  });

  it('rechaza un token expirado', () => {
    const token = jwt.sign({ id: 7 }, process.env.JWT_SECRET, {
      expiresIn: '-1s',
    });

    expect(() => AuthServices.verifyToken(token)).toThrow('Token inválido');
  });
});
