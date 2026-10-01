jest.mock('../../src/database/index', () => ({ query: jest.fn() }));

const db = require('../../src/database/index');
const { authRepository } = require('../../src/Auth/repository');

describe('authRepository.findByEmail', () => {
  beforeEach(() => db.query.mockResolvedValue({ rows: [] }));

  it('compara el email sin distinguir mayúsculas', async () => {
    await authRepository.findByEmail('Ana@Camintra.COM');

    const [sql, valores] = db.query.mock.calls[0];
    expect(sql).toMatch(/LOWER\(email\) = LOWER\(\$1\)/);
    expect(valores).toEqual(['Ana@Camintra.COM']);
  });

  it('recorta los espacios que deja el autocompletado', async () => {
    await authRepository.findByEmail('  ana@camintra.com  ');

    expect(db.query.mock.calls[0][1]).toEqual(['ana@camintra.com']);
  });

  it('pide el password_hash, que es lo que necesita el login', async () => {
    await authRepository.findByEmail('ana@camintra.com');

    expect(db.query.mock.calls[0][0]).toContain('password_hash');
  });

  it('no se cae si llega un email nulo', async () => {
    await expect(authRepository.findByEmail(undefined)).resolves.toBeNull();
    expect(db.query.mock.calls[0][1]).toEqual(['']);
  });

  it('devuelve null cuando no hay coincidencia', async () => {
    await expect(
      authRepository.findByEmail('nadie@camintra.com')
    ).resolves.toBeNull();
  });
});

describe('authRepository.create', () => {
  it('no devuelve el hash del usuario recién creado', async () => {
    db.query.mockResolvedValue({
      rows: [{ id: 9, nombre: 'Ana', email: 'ana@camintra.com' }],
    });

    const creado = await authRepository.create({
      nombre: 'Ana',
      email: 'ana@camintra.com',
      password: '$2b$04$hash',
    });

    const [sql, valores] = db.query.mock.calls[0];
    expect(sql).not.toMatch(/RETURNING\s+\*/);
    expect(sql).toMatch(/RETURNING id, nombre, email/);
    expect(valores).toEqual(['Ana', 'ana@camintra.com', '$2b$04$hash']);
    expect(creado).not.toHaveProperty('password_hash');
  });

  it('propaga el error de la base de datos', async () => {
    db.query.mockRejectedValue(new Error('unique violation'));

    await expect(authRepository.create({})).rejects.toThrow('unique violation');
  });
});
