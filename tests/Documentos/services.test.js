jest.mock('../../src/Documentos/repository', () => ({
  documentosRepository: {
    listar: jest.fn(),
    contar: jest.fn(),
    obtenerPorSlug: jest.fn(),
    obtenerPorId: jest.fn(),
    existeSlug: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    eliminar: jest.fn(),
    listarCategorias: jest.fn(),
  },
}));

const { documentosRepository } = require('../../src/Documentos/repository');
const { documentosService } = require('../../src/Documentos/services');

const { generarSlug } = documentosService;

const EDITOR = { id: 7, rol: 'editor' };
const ADMIN = { id: 1, rol: 'admin' };
const OTRO_EDITOR = { id: 9, rol: 'editor' };

const documento = (extra = {}) => ({
  id: 4,
  titulo: 'Política de vacaciones',
  contenido: 'Las vacaciones se piden...',
  slug: 'politica-de-vacaciones',
  autor_id: 7,
  ...extra,
});

beforeEach(() => {
  documentosRepository.listar.mockResolvedValue([]);
  documentosRepository.contar.mockResolvedValue(0);
  documentosRepository.existeSlug.mockResolvedValue(false);
  documentosRepository.crear.mockImplementation((autorId, datos) =>
    Promise.resolve({ id: 10, autor_id: autorId, ...datos })
  );
});

describe('generarSlug', () => {
  it('quita las tildes sin comerse la letra', () => {
    expect(generarSlug('Política de Vacaciones 2026')).toBe(
      'politica-de-vacaciones-2026'
    );
    expect(generarSlug('Guía de Inducción')).toBe('guia-de-induccion');
  });

  it('la ñ sobrevive como n', () => {
    expect(generarSlug('Diseño de Procesos')).toBe('diseno-de-procesos');
  });

  it('descarta los signos y no deja guiones dobles', () => {
    expect(generarSlug('¿Cómo pedir vacaciones?')).toBe(
      'como-pedir-vacaciones'
    );
    expect(generarSlug('Calidad & Seguridad -- 2026')).toBe(
      'calidad-seguridad-2026'
    );
  });

  it('no deja guiones al principio ni al final', () => {
    const slug = generarSlug('--- Manual ---');

    expect(slug).toBe('manual');
  });

  it('corta a 200 caracteres para que quepa en la columna', () => {
    expect(generarSlug('a'.repeat(500)).length).toBe(200);
  });

  it('con un título sin letras ni números devuelve cadena vacía', () => {
    // slugDisponible se encarga de poner 'documento' en ese caso
    expect(generarSlug('¿¡...!?')).toBe('');
  });

  it('no se cae con un título vacío o nulo', () => {
    expect(generarSlug('')).toBe('');
    expect(generarSlug(null)).toBe('');
    expect(generarSlug(undefined)).toBe('');
  });
});

describe('documentosService.crear: slug único', () => {
  it('usa el slug del título cuando está libre', async () => {
    await documentosService.crear(7, {
      titulo: 'Política de vacaciones',
      contenido: 'texto',
    });

    expect(documentosRepository.crear.mock.calls[0][1].slug).toBe(
      'politica-de-vacaciones'
    );
  });

  it('si el slug existe le pone -2', async () => {
    documentosRepository.existeSlug
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    await documentosService.crear(7, { titulo: 'Manual', contenido: 'texto' });

    expect(documentosRepository.crear.mock.calls[0][1].slug).toBe('manual-2');
  });

  it('sigue probando hasta encontrar uno libre', async () => {
    documentosRepository.existeSlug
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    await documentosService.crear(7, { titulo: 'Manual', contenido: 'texto' });

    expect(documentosRepository.crear.mock.calls[0][1].slug).toBe('manual-4');
  });

  it('un título sin letras cae en el slug "documento"', async () => {
    await documentosService.crear(7, { titulo: '¿¡!?', contenido: 'texto' });

    expect(documentosRepository.crear.mock.calls[0][1].slug).toBe('documento');
  });
});

describe('documentosService.crear: etiquetas', () => {
  const etiquetasGuardadas = () =>
    documentosRepository.crear.mock.calls[0][1].etiquetas;

  it('acepta una lista y la normaliza a minúsculas sin espacios', async () => {
    await documentosService.crear(7, {
      titulo: 'Manual',
      contenido: 'texto',
      etiquetas: ['  RRHH ', 'Vacaciones', 'rrhh'],
    });

    expect(etiquetasGuardadas()).toEqual(['rrhh', 'vacaciones', 'rrhh']);
  });

  it('acepta también una cadena separada por comas', async () => {
    await documentosService.crear(7, {
      titulo: 'Manual',
      contenido: 'texto',
      etiquetas: 'RRHH, Vacaciones ,Nomina',
    });

    expect(etiquetasGuardadas()).toEqual(['rrhh', 'vacaciones', 'nomina']);
  });

  it('descarta las vacías que deja una coma de más', async () => {
    await documentosService.crear(7, {
      titulo: 'Manual',
      contenido: 'texto',
      etiquetas: 'rrhh,,  ,nomina',
    });

    expect(etiquetasGuardadas()).toEqual(['rrhh', 'nomina']);
  });

  it('se queda con las primeras 15', async () => {
    await documentosService.crear(7, {
      titulo: 'Manual',
      contenido: 'texto',
      etiquetas: Array.from({ length: 40 }, (_, i) => `etiqueta${i}`),
    });

    expect(etiquetasGuardadas().length).toBe(15);
  });

  it('sin etiquetas no manda el campo, para no borrar las que ya hay', async () => {
    await documentosService.crear(7, { titulo: 'Manual', contenido: 'texto' });

    expect(etiquetasGuardadas()).toBeUndefined();
  });
});

describe('documentosService.crear: validación', () => {
  it('exige título y contenido', async () => {
    await expect(
      documentosService.crear(7, { contenido: 'solo contenido' })
    ).rejects.toMatchObject({ statusCode: 400 });

    await expect(
      documentosService.crear(7, { titulo: 'solo título' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('valida el estado contra la lista permitida', async () => {
    await expect(
      documentosService.crear(7, {
        titulo: 'x',
        contenido: 'y',
        estado: 'casi-listo',
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('traduce el departamento inexistente a un 400 entendible', async () => {
    const error = new Error('foreign key');
    error.code = '23503';
    documentosRepository.crear.mockRejectedValue(error);

    await expect(
      documentosService.crear(7, { titulo: 'x', contenido: 'y' })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'El departamento indicado no existe',
    });
  });
});

describe('documentosService.listar', () => {
  it('respeta el techo de MAX_LIMIT', async () => {
    await documentosService.listar({ limit: 900 });

    expect(documentosRepository.listar.mock.calls[0][0].limit).toBe(100);
  });

  it('calcula las páginas sobre el total', async () => {
    documentosRepository.contar.mockResolvedValue(31);

    const resultado = await documentosService.listar({ limit: 10 });

    expect(resultado).toMatchObject({ total: 31, totalPaginas: 4 });
  });

  it('sin documentos devuelve una página', async () => {
    await expect(documentosService.listar()).resolves.toMatchObject({
      totalPaginas: 1,
    });
  });
});

describe('documentosService: permisos de autoría', () => {
  beforeEach(() => {
    documentosRepository.obtenerPorId.mockResolvedValue(documento());
    documentosRepository.actualizar.mockResolvedValue(documento());
    documentosRepository.eliminar.mockResolvedValue(true);
  });

  it('el autor edita lo suyo', async () => {
    await expect(
      documentosService.actualizar(4, EDITOR, { titulo: 'Otro' })
    ).resolves.toBeDefined();
  });

  it('el admin edita lo de cualquiera', async () => {
    await expect(
      documentosService.actualizar(4, ADMIN, { titulo: 'Otro' })
    ).resolves.toBeDefined();
  });

  it('un editor no toca el documento de otro', async () => {
    await expect(
      documentosService.actualizar(4, OTRO_EDITOR, { titulo: 'Otro' })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(documentosRepository.actualizar).not.toHaveBeenCalled();
  });

  it('un editor no borra el documento de otro', async () => {
    await expect(
      documentosService.eliminar(4, OTRO_EDITOR)
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('con un id inexistente actualizar devuelve null y eliminar false', async () => {
    documentosRepository.obtenerPorId.mockResolvedValue(null);

    await expect(
      documentosService.actualizar(99, ADMIN, { titulo: 'x' })
    ).resolves.toBeNull();
    await expect(documentosService.eliminar(99, ADMIN)).resolves.toBe(false);
  });

  it('sin datos que cambiar responde 400', async () => {
    await expect(
      documentosService.actualizar(4, EDITOR, {})
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('documentosService.obtenerPorSlug', () => {
  it('devuelve el documento', async () => {
    documentosRepository.obtenerPorSlug.mockResolvedValue(documento());

    await expect(
      documentosService.obtenerPorSlug('politica-de-vacaciones')
    ).resolves.toMatchObject({ id: 4 });
  });

  it('un fallo de la base sale como 500 operacional', async () => {
    documentosRepository.obtenerPorSlug.mockRejectedValue(new Error('boom'));

    await expect(documentosService.obtenerPorSlug('x')).rejects.toMatchObject({
      statusCode: 500,
      isOperational: true,
    });
  });
});
