const db = require('../database/index');
const debug = require('debug')('app:configuracion-repository');

// La parametrización es una sola fila; la migración 008 la crea con id = 1
const FILA = 1;

/**
 * Guarda la parametrización.
 *
 * COALESCE deja intacto lo que el formulario no mandó: el servicio
 * convierte los campos vacíos a null y aquí eso significa "no cambiar",
 * no "borrar".
 */
const actualizar = async json => {
  const query = `
    INSERT INTO plataforma (
      id,
      logo_url,
      color_hex,
      ruta_almacenamiento,
      idioma,
      tiempo_sesion_minutos,
      requiere_autenticacion,
      mostrar_dashboard,
      mostrar_carousel,
      pass_longitud_minima,
      pass_caducidad_dias,
      nombre_sitio,
      favicon_url,
      email_soporte,
      modo_mantenimiento,
      max_intentos_login
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    ON CONFLICT (id)
    DO UPDATE SET
      logo_url = COALESCE(EXCLUDED.logo_url, plataforma.logo_url),
      color_hex = COALESCE(EXCLUDED.color_hex, plataforma.color_hex),
      ruta_almacenamiento = COALESCE(
        EXCLUDED.ruta_almacenamiento,
        plataforma.ruta_almacenamiento
      ),
      idioma = COALESCE(EXCLUDED.idioma, plataforma.idioma),
      tiempo_sesion_minutos = COALESCE(
        EXCLUDED.tiempo_sesion_minutos,
        plataforma.tiempo_sesion_minutos
      ),
      requiere_autenticacion = COALESCE(
        EXCLUDED.requiere_autenticacion,
        plataforma.requiere_autenticacion
      ),
      mostrar_dashboard = COALESCE(
        EXCLUDED.mostrar_dashboard,
        plataforma.mostrar_dashboard
      ),
      mostrar_carousel = COALESCE(
        EXCLUDED.mostrar_carousel,
        plataforma.mostrar_carousel
      ),
      pass_longitud_minima = COALESCE(
        EXCLUDED.pass_longitud_minima,
        plataforma.pass_longitud_minima
      ),
      pass_caducidad_dias = COALESCE(
        EXCLUDED.pass_caducidad_dias,
        plataforma.pass_caducidad_dias
      ),
      nombre_sitio = COALESCE(EXCLUDED.nombre_sitio, plataforma.nombre_sitio),
      favicon_url = COALESCE(EXCLUDED.favicon_url, plataforma.favicon_url),
      email_soporte = COALESCE(
        EXCLUDED.email_soporte,
        plataforma.email_soporte
      ),
      modo_mantenimiento = COALESCE(
        EXCLUDED.modo_mantenimiento,
        plataforma.modo_mantenimiento
      ),
      max_intentos_login = COALESCE(
        EXCLUDED.max_intentos_login,
        plataforma.max_intentos_login
      ),
      updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;

  const values = [
    FILA,
    json.logo,
    json.color,
    json.path,
    json.idioma,
    json.tiemposesion,
    json.autenticacion,
    json.dashboard,
    json.carousel,
    json.longitudminimapass,
    json.caducidad,
    json.sitionombre,
    json.favicon,
    json.emailsoporte,
    json.Mantenimiento,
    json.maximointentos,
  ];

  try {
    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    debug('Error actualizando parametrización:', error);
    throw error;
  }
};

const obtener = async () => {
  try {
    const result = await db.query('SELECT * FROM plataforma WHERE id = $1', [
      FILA,
    ]);

    return result.rows[0] || null;
  } catch (error) {
    debug('Error obteniendo parametrización:', error);
    throw error;
  }
};

module.exports.configuracionRepository = {
  actualizar,
  obtener,
};
