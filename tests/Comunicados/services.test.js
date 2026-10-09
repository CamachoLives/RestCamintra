jest.mock('../../src/Comunicados/repository', () => ({
  comunicadosRepository: {
    listar: jest.fn(),
    contar: jest.fn(),
    contarNoLeidos: jest.fn(),
    obtener: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    eliminar: jest.fn(),
    marcarLeido: jest.fn(),
    listarCategorias: jest.fn(),
  },
}));
jest.mock('../../src/Notifications/services', () => ({
  notificationsService: { avisarATodos: jest.fn() },
}));

const { comunicadosRepository } = require('../../src/Comunicados/repository');
const { notificationsService } = require('../../src/Notifications/services');
const { comunicadosService } = require('../../src/Comunicados/services');

const EDITOR = { id: 7, rol: 'editor' };
const ADMIN = { id: 1, rol: 'admin' };
const OTRO_EDITOR = { id: 9, rol: 'editor' };

const comunicado = (extra = {}) => ({
  id: 3,
  titulo: 'Cambio de horario',
  contenido: 'A partir del lunes...',
  autor_id: 7,
  estado: 'publicado',
  ...extra,
});

beforeEach(() => {
  comunicadosRepository.listar.mockResolvedValue([]);
  comunicadosRepository.contar.mockResolvedValue(0);
  comunicadosRepository.contarNoLeidos.mockResolvedValue(0);
  notificationsService.avisarATodos.mockResolvedValue(undefined);
});

describe('comunicadosService.listar', () => {
  it('arma el sobre que espera el front', async () => {
    comunicadosRepository.listar.mockResolvedValue([comunicado()]);
    comunicadosRepository.contar.mockResolvedValue(25);
    comunicadosRepository.contarNoLeidos.mockResolvedValue(4);

    const resultado = await comunicadosService.listar(7, { limit: 10 });

    expect(resultado).toMatchObject({
      total: 25,
      noLeidos: 4,
      page: 1,
      limit: 10,
      totalPaginas: 3,
    });
    expect(resultado.items.length).toBe(1);
  });

  it('aplica los valores por defecto de paginación', async () => {
    await comunicadosService.listar(7);

    expect(comunicadosRepository.listar.mock.calls[0][1]).toMatchObject({
      page: 1,
      limit: 10,
    });
  });

  it('no deja pedir más de MAX_LIMIT registros de una vez', async () => {
    await comunicadosService.listar(7, { limit: 5000 });

    expect(comunicadosRepository.listar.mock.calls[0][1].limit).toBe(100);
  });

  it('una página negativa se trata como la primera', async () => {
    await comunicadosService.listar(7, { page: -3 });

    expect(comunicadosRepository.listar.mock.calls[0][1].page).toBe(1);
  });

  it('con texto en los parámetros usa el valor por defecto, no NaN', async () => {
    await comunicadosService.listar(7, { page: 'abc', limit: 'xyz' });

    expect(comunicadosRepository.listar.mock.calls[0][1]).toMatchObject({
      page: 1,
      limit: 10,
    });
  });

  it('sin resultados devuelve una página, no cero', async () => {
    const resultado = await comunicadosService.listar(7);

    expect(resultado.totalPaginas).toBe(1);
  });

  it('cuenta leídos y no leídos en paralelo, no uno tras otro', async () => {
    await comunicadosService.listar(7);

    expect(comunicadosRepository.listar).toHaveBeenCalled();
    expect(comunicadosRepository.contar).toHaveBeenCalled();
    expect(comunicadosRepository.contarNoLeidos).toHaveBeenCalledWith(7);
  });

  it('un fallo de la base sale como 500 operacional', async () => {
    comunicadosRepository.listar.mockRejectedValue(new Error('timeout'));

    await expect(comunicadosService.listar(7)).rejects.toMatchObject({
      statusCode: 500,
      isOperational: true,
    });
  });
});

describe('comunicadosService.crear', () => {
  beforeEach(() =>
    comunicadosRepository.crear.mockImplementation((autorId, datos) =>
      Promise.resolve({ id: 10, autor_id: autorId, ...datos })
    )
  );

  it('exige título y contenido', async () => {
    await expect(
      comunicadosService.crear(7, { contenido: 'solo contenido' })
    ).rejects.toMatchObject({ statusCode: 400 });

    await expect(
      comunicadosService.crear(7, { titulo: 'solo título' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('no acepta un título de solo espacios', async () => {
    await expect(
      comunicadosService.crear(7, { titulo: '   ', contenido: 'algo' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('recorta el título antes de guardarlo', async () => {
    await comunicadosService.crear(7, {
      titulo: '  Cambio de horario  ',
      contenido: 'texto',
    });

    expect(comunicadosRepository.crear.mock.calls[0][1].titulo).toBe(
      'Cambio de horario'
    );
  });

  it('valida la prioridad contra la lista permitida', async () => {
    await expect(
      comunicadosService.crear(7, {
        titulo: 'x',
        contenido: 'y',
        prioridad: 'altísima',
      })
    ).rejects.toMatchObject({ statusCode: 400 });

    await expect(
      comunicadosService.crear(7, {
        titulo: 'x',
        contenido: 'y',
        prioridad: 'urgente',
      })
    ).resolves.toMatchObject({ id: 10 });
  });

  it('valida el estado contra la lista permitida', async () => {
    await expect(
      comunicadosService.crear(7, {
        titulo: 'x',
        contenido: 'y',
        estado: 'publicadito',
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rechaza una fecha de expiración que no es fecha', async () => {
    await expect(
      comunicadosService.crear(7, {
        titulo: 'x',
        contenido: 'y',
        expira_en: 'el mes que viene',
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('avisa a todos cuando el comunicado sale publicado', async () => {
    comunicadosRepository.crear.mockResolvedValue(
      comunicado({ estado: 'publicado' })
    );

    await comunicadosService.crear(7, { titulo: 'x', contenido: 'y' });

    expect(notificationsService.avisarATodos).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'comunicado',
        enlace: '/comunicados/3',
        // Al autor no se le notifica su propio comunicado
        exceptoId: 7,
      })
    );
  });

  it('no avisa a nadie si queda en borrador', async () => {
    comunicadosRepository.crear.mockResolvedValue(
      comunicado({ estado: 'borrador' })
    );

    await comunicadosService.crear(7, { titulo: 'x', contenido: 'y' });

    expect(notificationsService.avisarATodos).not.toHaveBeenCalled();
  });

  it('traduce la categoría inexistente a un 400 entendible', async () => {
    const error = new Error('violates foreign key constraint');
    error.code = '23503';
    comunicadosRepository.crear.mockRejectedValue(error);

    await expect(
      comunicadosService.crear(7, { titulo: 'x', contenido: 'y' })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'La categoría indicada no existe',
    });
  });
});

describe('comunicadosService.actualizar', () => {
  beforeEach(() => {
    comunicadosRepository.obtener.mockResolvedValue(comunicado());
    comunicadosRepository.actualizar.mockResolvedValue(
      comunicado({ titulo: 'Nuevo' })
    );
  });

  it('el autor edita lo suyo', async () => {
    await expect(
      comunicadosService.actualizar(3, EDITOR, { titulo: 'Nuevo' })
    ).resolves.toMatchObject({ titulo: 'Nuevo' });
  });

  it('el admin edita lo de cualquiera', async () => {
    await expect(
      comunicadosService.actualizar(3, ADMIN, { titulo: 'Nuevo' })
    ).resolves.toMatchObject({ titulo: 'Nuevo' });
  });

  it('un editor no toca el comunicado de otro', async () => {
    await expect(
      comunicadosService.actualizar(3, OTRO_EDITOR, { titulo: 'Nuevo' })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(comunicadosRepository.actualizar).not.toHaveBeenCalled();
  });

  it('compara los ids sin importar si vienen como texto', async () => {
    // El id del token puede llegar como string y PostgreSQL devuelve número
    comunicadosRepository.obtener.mockResolvedValue(
      comunicado({ autor_id: '7' })
    );

    await expect(
      comunicadosService.actualizar(
        3,
        { id: 7, rol: 'editor' },
        { titulo: 'x' }
      )
    ).resolves.toBeDefined();
  });

  it('con un id inexistente devuelve null para que el controlador haga el 404', async () => {
    comunicadosRepository.obtener.mockResolvedValue(null);

    await expect(
      comunicadosService.actualizar(99, EDITOR, { titulo: 'x' })
    ).resolves.toBeNull();
  });

  it('sin datos que cambiar responde 400', async () => {
    await expect(
      comunicadosService.actualizar(3, EDITOR, {})
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('en una edición parcial no exige título ni contenido', async () => {
    await expect(
      comunicadosService.actualizar(3, EDITOR, { prioridad: 'alta' })
    ).resolves.toBeDefined();
  });

  it('pero sí valida lo que sí viene', async () => {
    await expect(
      comunicadosService.actualizar(3, EDITOR, { prioridad: 'inventada' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('comunicadosService.eliminar', () => {
  it('el autor borra lo suyo', async () => {
    comunicadosRepository.obtener.mockResolvedValue(comunicado());
    comunicadosRepository.eliminar.mockResolvedValue(true);

    await expect(comunicadosService.eliminar(3, EDITOR)).resolves.toBe(true);
  });

  it('un editor no borra lo de otro', async () => {
    comunicadosRepository.obtener.mockResolvedValue(comunicado());

    await expect(
      comunicadosService.eliminar(3, OTRO_EDITOR)
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(comunicadosRepository.eliminar).not.toHaveBeenCalled();
  });

  it('con un id inexistente devuelve false', async () => {
    comunicadosRepository.obtener.mockResolvedValue(null);

    await expect(comunicadosService.eliminar(99, ADMIN)).resolves.toBe(false);
  });
});

describe('comunicadosService.marcarLeido', () => {
  it('devuelve el contador recalculado para el badge', async () => {
    comunicadosRepository.obtener.mockResolvedValue(comunicado());
    comunicadosRepository.marcarLeido.mockResolvedValue(undefined);
    comunicadosRepository.contarNoLeidos.mockResolvedValue(2);

    await expect(comunicadosService.marcarLeido(3, 7)).resolves.toEqual({
      noLeidos: 2,
    });
  });

  it('no se puede marcar como leído algo que no existe', async () => {
    comunicadosRepository.obtener.mockResolvedValue(null);

    await expect(comunicadosService.marcarLeido(99, 7)).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(comunicadosRepository.marcarLeido).not.toHaveBeenCalled();
  });
});

describe('comunicadosService.listarCategorias', () => {
  it('devuelve lo que trae el repositorio', async () => {
    comunicadosRepository.listarCategorias.mockResolvedValue([
      { id: 1, nombre: 'General' },
    ]);

    await expect(comunicadosService.listarCategorias()).resolves.toEqual([
      { id: 1, nombre: 'General' },
    ]);
  });

  it('un fallo sale como 500 operacional', async () => {
    comunicadosRepository.listarCategorias.mockRejectedValue(new Error('boom'));

    await expect(comunicadosService.listarCategorias()).rejects.toMatchObject({
      statusCode: 500,
    });
  });
});
