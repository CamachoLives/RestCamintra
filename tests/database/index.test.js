// Doble del pool de pg: cada instancia guarda los manejadores que el
// modulo registra, para poder dispararlos desde la prueba.
const instancias = [];

jest.mock('pg', () => ({
  Pool: jest.fn(function (opciones) {
    this.opciones = opciones;
    this.manejadores = {};
    this.query = jest.fn(() => Promise.resolve({ rows: [] }));
    this.end = jest.fn(() => Promise.resolve());
    this.on = jest.fn((evento, fn) => {
      this.manejadores[evento] = fn;
      return this;
    });

    instancias.push(this);
  }),
}));

const db = require('../../src/database/index');

const ultimoPool = () => instancias[instancias.length - 1];

beforeEach(() => {
  instancias.length = 0;
});

// El modulo guarda el pool en una variable: cerrarlo deja el estado limpio
afterEach(async () => {
  await db.closePool();
});

describe('pool de conexiones', () => {
  it('se crea una sola vez, aunque haya muchas consultas', async () => {
    await db.query('SELECT 1');
    await db.query('SELECT 2');
    await db.query('SELECT 3');

    expect(instancias.length).toBe(1);
  });

  it('se configura con los límites que esperamos', () => {
    db.connectDB();

    expect(ultimoPool().opciones).toMatchObject({
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  });

  it('en desarrollo no exige SSL', () => {
    db.connectDB();

    expect(ultimoPool().opciones.ssl).toBe(false);
  });

  it('registra manejadores de connect, error y remove', () => {
    db.connectDB();

    expect(Object.keys(ultimoPool().manejadores).sort()).toEqual([
      'connect',
      'error',
      'remove',
    ]);
  });

  it('un error de un cliente en reposo no tumba el proceso', () => {
    db.connectDB();

    // Antes este manejador llamaba a reject() sobre una promesa que ya
    // habia resuelto: el error se perdia en silencio.
    expect(() =>
      ultimoPool().manejadores.error(new Error('connection terminated'))
    ).not.toThrow();
  });
});

describe('query', () => {
  it('delega en pool.query, sin tomar y soltar el cliente a mano', async () => {
    const resultado = await db.query('SELECT * FROM usuarios WHERE id = $1', [
      1,
    ]);

    expect(ultimoPool().query).toHaveBeenCalledWith(
      'SELECT * FROM usuarios WHERE id = $1',
      [1]
    );
    expect(resultado.rows).toEqual([]);
  });

  it('crea el pool en la primera consulta si nadie lo pidió antes', async () => {
    expect(instancias.length).toBe(0);

    await db.query('SELECT 1');

    expect(instancias.length).toBe(1);
  });

  it('propaga el error de la base sin envolverlo', async () => {
    db.connectDB();
    const fallo = new Error('relation "usuarios" does not exist');
    fallo.code = '42P01';
    ultimoPool().query.mockRejectedValue(fallo);

    await expect(db.query('SELECT 1')).rejects.toMatchObject({
      code: '42P01',
    });
  });

  it('un fallo no deja el pool inservible para la siguiente consulta', async () => {
    db.connectDB();
    ultimoPool().query.mockRejectedValueOnce(new Error('deadlock detected'));

    await expect(db.query('UPDATE usuarios SET activo = TRUE')).rejects.toThrow(
      'deadlock'
    );

    ultimoPool().query.mockResolvedValue({ rows: [{ id: 1 }] });
    await expect(db.query('SELECT 1')).resolves.toMatchObject({
      rows: [{ id: 1 }],
    });
    expect(instancias.length).toBe(1);
  });
});

describe('closePool', () => {
  it('cierra el pool y permite volver a crearlo', async () => {
    db.connectDB();
    const primero = ultimoPool();

    await db.closePool();

    expect(primero.end).toHaveBeenCalled();

    db.connectDB();
    expect(instancias.length).toBe(2);
  });

  it('sin pool abierto no hace nada ni se queja', async () => {
    await expect(db.closePool()).resolves.toBeUndefined();
    expect(instancias.length).toBe(0);
  });
});

describe('testConnection', () => {
  it('devuelve true si la base responde', async () => {
    db.connectDB();
    ultimoPool().query.mockResolvedValue({ rows: [{ now: '2026-10-08' }] });

    await expect(db.testConnection()).resolves.toBe(true);
  });

  it('devuelve false en vez de lanzar si la base no responde', async () => {
    db.connectDB();
    ultimoPool().query.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(db.testConnection()).resolves.toBe(false);
  });
});
