jest.mock('../../src/configuracion/repository', () => ({
  configuracionRepository: { obtener: jest.fn(), actualizar: jest.fn() },
}));

const express = require('express');
const request = require('supertest');
const {
  configuracionRepository,
} = require('../../src/configuracion/repository');
const { configuracion } = require('../../src/configuracion/index');
const { firmar } = require('../../src/common/tokens');
const { errorHandler, notFound } = require('../../src/middleware/errorHandler');

const tokenDe = rol => firmar({ id: 1, nombre: 'Quien sea', rol });

let app;

beforeEach(() => {
  app = express();
  app.use(express.json());
  configuracion(app);
  app.use(notFound);
  app.use(errorHandler);
});

describe('GET /api/parametrizacion/plataforma', () => {
  it('cuelga de /api como el resto de los módulos', async () => {
    configuracionRepository.obtener.mockResolvedValue({ id: 1, idioma: 'es' });

    const res = await request(app)
      .get('/api/parametrizacion/plataforma')
      .set('Authorization', `Bearer ${tokenDe('colaborador')}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ idioma: 'es' });
  });

  it('sin token responde 401', async () => {
    const res = await request(app).get('/api/parametrizacion/plataforma');

    expect(res.status).toBe(401);
  });

  it('si la tabla está vacía responde 404 con un mensaje claro', async () => {
    configuracionRepository.obtener.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/parametrizacion/plataforma')
      .set('Authorization', `Bearer ${tokenDe('admin')}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('parametrizada');
  });
});

describe('POST /api/parametrizacion/plataforma', () => {
  it('el administrador guarda los cambios', async () => {
    configuracionRepository.actualizar.mockResolvedValue({
      id: 1,
      nombre_sitio: 'Intranet Camintra',
    });

    const res = await request(app)
      .post('/api/parametrizacion/plataforma')
      .set('Authorization', `Bearer ${tokenDe('admin')}`)
      .send({ sitionombre: 'Intranet Camintra', tiemposesion: '30' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ nombre_sitio: 'Intranet Camintra' });
  });

  it.each(['colaborador', 'editor'])(
    'un %s no puede cambiar la parametrización',
    async rol => {
      const res = await request(app)
        .post('/api/parametrizacion/plataforma')
        .set('Authorization', `Bearer ${tokenDe(rol)}`)
        .send({ sitionombre: 'Mi intranet' });

      // Antes bastaba con estar autenticado para reconfigurar la plataforma
      expect(res.status).toBe(403);
      expect(configuracionRepository.actualizar).not.toHaveBeenCalled();
    }
  );

  it('un error de validación responde 400, no 404', async () => {
    const res = await request(app)
      .post('/api/parametrizacion/plataforma')
      .set('Authorization', `Bearer ${tokenDe('admin')}`)
      .send({ tiemposesion: 'mucho rato' });

    expect(res.status).toBe(400);
  });

  it('un fallo de la base responde 500, no 404', async () => {
    configuracionRepository.actualizar.mockRejectedValue(new Error('boom'));

    const res = await request(app)
      .post('/api/parametrizacion/plataforma')
      .set('Authorization', `Bearer ${tokenDe('admin')}`)
      .send({ idioma: 'es' });

    // El catch anterior respondía 404 a cualquier fallo
    expect(res.status).toBe(500);
  });

  it('con cuerpo vacío responde 400', async () => {
    const res = await request(app)
      .post('/api/parametrizacion/plataforma')
      .set('Authorization', `Bearer ${tokenDe('admin')}`)
      .send({});

    expect(res.status).toBe(400);
  });
});
