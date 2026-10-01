jest.mock('../../src/database/index', () => ({ query: jest.fn() }));

const db = require('../../src/database/index');
const { UsersRepository } = require('../../src/Users/repository');

// Lo que devolvería PostgreSQL con las columnas públicas
const FILA = {
  id: 3,
  nombre: 'Ana Ruiz',
  email: 'ana@camintra.com',
  rol: 'editor',
  activo: true,
  ultimo_acceso: '2026-09-30T10:00:00.000Z',
};

const sqlDeLaUltimaLlamada = () => db.query.mock.calls.at(-1)[0];

describe('UsersRepository y el password_hash', () => {
  it('getUserById pide columnas explícitas, nunca SELECT *', async () => {
    db.query.mockResolvedValue({ rows: [FILA] });

    const usuario = await UsersRepository.getUserById(3);

    const sql = sqlDeLaUltimaLlamada();
    expect(sql).not.toMatch(/SELECT\s+\*/i);
    expect(sql).not.toMatch(/password/i);
    expect(sql).toContain('u.email');
    expect(usuario).toEqual(FILA);
  });

  it('getAllUsers tampoco trae el hash', async () => {
    db.query.mockResolvedValue({ rows: [FILA] });

    await UsersRepository.getAllUsers({});

    expect(sqlDeLaUltimaLlamada()).not.toMatch(/SELECT\s+\*|password/i);
  });

  it('updateUser devuelve solo las columnas públicas', async () => {
    db.query.mockResolvedValue({ rows: [FILA] });

    await UsersRepository.updateUser(3, { nombre: 'Ana R.' });

    const sql = sqlDeLaUltimaLlamada();
    expect(sql).toMatch(/RETURNING/);
    expect(sql).not.toMatch(/RETURNING\s+\*/);
    expect(sql).not.toMatch(/password/i);
  });
});

describe('UsersRepository.getUserById', () => {
  it('devuelve null cuando no hay filas', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await expect(UsersRepository.getUserById(99)).resolves.toBeNull();
  });

  it('propaga el error de la base de datos', async () => {
    db.query.mockRejectedValue(new Error('conexión caída'));

    await expect(UsersRepository.getUserById(1)).rejects.toThrow(
      'conexión caída'
    );
  });
});

describe('UsersRepository.getAllUsers', () => {
  beforeEach(() => db.query.mockResolvedValue({ rows: [] }));

  it('sin filtros no arma WHERE y pagina desde el inicio', async () => {
    await UsersRepository.getAllUsers({});

    const [sql, valores] = db.query.mock.calls[0];
    expect(sql).not.toMatch(/WHERE/);
    expect(valores).toEqual([10, 0]);
  });

  it('filtra por email con ILIKE parcial y parametrizado', async () => {
    await UsersRepository.getAllUsers({ email: 'ana', page: 1, limit: 5 });

    const [sql, valores] = db.query.mock.calls[0];
    expect(sql).toContain('u.email ILIKE $1');
    expect(valores).toEqual(['%ana%', 5, 0]);
  });

  it('combina email y rol numerando bien los parámetros', async () => {
    await UsersRepository.getAllUsers({ email: 'ana', rol: 'admin' });

    const [sql, valores] = db.query.mock.calls[0];
    expect(sql).toContain('u.email ILIKE $1 AND u.rol = $2');
    expect(valores).toEqual(['%ana%', 'admin', 10, 0]);
  });

  it('calcula el OFFSET según la página', async () => {
    await UsersRepository.getAllUsers({ page: 3, limit: 20 });

    expect(db.query.mock.calls[0][1]).toEqual([20, 40]);
  });
});

describe('UsersRepository.updateUser', () => {
  it('solo deja actualizar los campos permitidos', async () => {
    db.query.mockResolvedValue({ rows: [FILA] });

    await UsersRepository.updateUser(3, {
      nombre: 'Ana R.',
      rol: 'admin',
      // intentos de escalar por campos que no son editables
      password_hash: '$2b$10$otro',
      id: 1,
    });

    const [sql, valores] = db.query.mock.calls[0];
    expect(sql).toContain('nombre = $1');
    expect(sql).toContain('rol = $2');
    expect(sql).not.toMatch(/password_hash\s*=/);
    expect(valores).toEqual(['Ana R.', 'admin', 3]);
  });

  it('sin campos editables no ejecuta el UPDATE', async () => {
    db.query.mockResolvedValue({ rows: [FILA] });

    await UsersRepository.updateUser(3, { campoInventado: 'x' });

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query.mock.calls[0][0]).toMatch(/SELECT/);
  });
});

describe('UsersRepository.deleteUser', () => {
  it('es una baja lógica: desactiva en vez de borrar', async () => {
    db.query.mockResolvedValue({ rowCount: 1 });

    await expect(UsersRepository.deleteUser(3)).resolves.toBe(true);
    expect(sqlDeLaUltimaLlamada()).toMatch(
      /UPDATE usuarios SET activo = FALSE/
    );
    expect(sqlDeLaUltimaLlamada()).not.toMatch(/DELETE/i);
  });

  it('devuelve false si el id no existe', async () => {
    db.query.mockResolvedValue({ rowCount: 0 });

    await expect(UsersRepository.deleteUser(99)).resolves.toBe(false);
  });
});

describe('UsersRepository.updateUltimoAcceso', () => {
  it('no tumba el login si falla el sello de acceso', async () => {
    db.query.mockRejectedValue(new Error('timeout'));

    await expect(
      UsersRepository.updateUltimoAcceso(3)
    ).resolves.toBeUndefined();
  });
});
