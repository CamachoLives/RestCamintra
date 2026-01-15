// src/modules/users/user.repository.js
const db = require('../database/index');

const updateParametrizacionPlataforma = async (id, json) => {

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
    VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    ON CONFLICT (id) 
    DO UPDATE SET 
      logo_url = EXCLUDED.logo_url,
      color_hex = EXCLUDED.color_hex,
      ruta_almacenamiento = EXCLUDED.ruta_almacenamiento,
      idioma = EXCLUDED.idioma,
      tiempo_sesion_minutos = EXCLUDED.tiempo_sesion_minutos,
      requiere_autenticacion = EXCLUDED.requiere_autenticacion,
      mostrar_dashboard = EXCLUDED.mostrar_dashboard,
      mostrar_carousel = EXCLUDED.mostrar_carousel,
      pass_longitud_minima = EXCLUDED.pass_longitud_minima,
      pass_caducidad_dias = EXCLUDED.pass_caducidad_dias,
      nombre_sitio = EXCLUDED.nombre_sitio,
      favicon_url = EXCLUDED.favicon_url,
      email_soporte = EXCLUDED.email_soporte,
      modo_mantenimiento = EXCLUDED.modo_mantenimiento,
      max_intentos_login = EXCLUDED.max_intentos_login,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;
  const values = [
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
    json.maximointentos
  ];

  try {
    const result = await db.query(query, values);
    console.log("Configuración -->", result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Error actualizando parametrización:', error);
    throw error;
  }


};

const getParametrizacionPlataforma = async (id) => {
  try {
    const query = `
      GET parametros
      SET
        logo = $1,
      WHERE id = $10
      RETURNING *;
    `;
    const values = {
      id,
    }
    const result = await db.query(query, values);
    return result.rows[0];
  }
  catch (error) {
    throw new Error("No se pudo ejecutar bien la query..!", error);

  }
}


module.exports.configuracionRepository = {
  updateParametrizacionPlataforma,
  getParametrizacionPlataforma
};
