jest.mock('../../src/configuracion/repository', () => ({
  configuracionRepository: { obtener: jest.fn(), actualizar: jest.fn() },
}));

const {
  configuracionRepository,
} = require('../../src/configuracion/repository');
const { configuracionService } = require('../../src/configuracion/services');

const { normalizar } = configuracionService;

describe('normalizar', () => {
  it('convierte los campos vacíos a null para no tocar la columna', () => {
    // El formulario manda '' en todo lo que el administrador no editó, y
    // un '' en una columna INTEGER reventaba la consulta
    const limpio = normalizar({ tiemposesion: '', logo: '', caducidad: '' });

    expect(limpio.tiemposesion).toBeNull();
    expect(limpio.logo).toBeNull();
    expect(limpio.caducidad).toBeNull();
  });

  it('pasa los números del formulario a entero', () => {
    const limpio = normalizar({ tiemposesion: '45', maximointentos: '5' });

    expect(limpio.tiemposesion).toBe(45);
    expect(limpio.maximointentos).toBe(5);
  });

  it('rechaza un número inválido con 400 en vez de dejarlo llegar a la base', () => {
    expect(() => normalizar({ tiemposesion: 'mucho' })).toThrow(
      /número entero/
    );
    expect(() => normalizar({ caducidad: '-3' })).toThrow(/número entero/);
    expect(() => normalizar({ longitudminimapass: '6.5' })).toThrow(
      /número entero/
    );
  });

  it('traduce los booleanos que llegan como texto', () => {
    const limpio = normalizar({
      dashboard: 'true',
      carousel: 'false',
      autenticacion: true,
      Mantenimiento: 'si',
    });

    expect(limpio.dashboard).toBe(true);
    expect(limpio.carousel).toBe(false);
    expect(limpio.autenticacion).toBe(true);
    expect(limpio.Mantenimiento).toBe(true);
  });

  it('recorta los textos', () => {
    expect(normalizar({ sitionombre: '  Intranet  ' }).sitionombre).toBe(
      'Intranet'
    );
  });

  it('ignora los campos que no son del formulario', () => {
    const limpio = normalizar({ id: 99, logo: 'x.png' });

    expect(limpio).not.toHaveProperty('id');
    expect(limpio.logo).toBe('x.png');
  });
});

describe('configuracionService.actualizar', () => {
  beforeEach(() =>
    configuracionRepository.actualizar.mockResolvedValue({ id: 1 })
  );

  it('guarda la parametrización normalizada', async () => {
    await configuracionService.actualizar({
      sitionombre: 'Intranet Camintra',
      tiemposesion: '30',
      dashboard: 'true',
    });

    const enviado = configuracionRepository.actualizar.mock.calls[0][0];
    expect(enviado.tiemposesion).toBe(30);
    expect(enviado.dashboard).toBe(true);
  });

  it('con cuerpo vacío responde 400', async () => {
    await expect(configuracionService.actualizar({})).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(configuracionRepository.actualizar).not.toHaveBeenCalled();
  });

  it('valida el email de soporte', async () => {
    await expect(
      configuracionService.actualizar({ emailsoporte: 'soporte-arroba' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('valida que el color sea hexadecimal', async () => {
    await expect(
      configuracionService.actualizar({ color: 'azulito' })
    ).rejects.toMatchObject({ statusCode: 400 });

    await expect(
      configuracionService.actualizar({ color: '#1d4ed8' })
    ).resolves.toMatchObject({ id: 1 });
  });

  it('convierte un fallo inesperado de la base en un 500 sin filtrar detalle', async () => {
    configuracionRepository.actualizar.mockRejectedValue(
      new Error('column "idioma" does not exist')
    );

    await expect(
      configuracionService.actualizar({ idioma: 'es' })
    ).rejects.toMatchObject({
      statusCode: 500,
      message: 'Error al actualizar la parametrización',
    });
  });
});

describe('configuracionService.obtener', () => {
  it('devuelve la fila de parametrización', async () => {
    configuracionRepository.obtener.mockResolvedValue({ id: 1, idioma: 'es' });

    await expect(configuracionService.obtener()).resolves.toMatchObject({
      idioma: 'es',
    });
  });

  it('devuelve null si la tabla está vacía, sin inventar un error', async () => {
    configuracionRepository.obtener.mockResolvedValue(null);

    await expect(configuracionService.obtener()).resolves.toBeNull();
  });

  it('traduce el fallo de la base a un 500 operacional', async () => {
    configuracionRepository.obtener.mockRejectedValue(new Error('ECONN'));

    await expect(configuracionService.obtener()).rejects.toMatchObject({
      statusCode: 500,
      isOperational: true,
    });
  });
});
