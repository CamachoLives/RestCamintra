-- Parametrización de la plataforma: una sola fila (id = 1) con los ajustes
-- globales de la intranet. La tabla existía solo en las bases creadas a
-- mano, así que una instalación nueva se quedaba sin ella.

CREATE TABLE IF NOT EXISTS plataforma (
    id INTEGER PRIMARY KEY DEFAULT 1,
    logo_url VARCHAR(300) DEFAULT '',
    favicon_url VARCHAR(300) DEFAULT '',
    color_hex VARCHAR(20) DEFAULT '#1d4ed8',
    ruta_almacenamiento VARCHAR(300) DEFAULT '',
    idioma VARCHAR(10) DEFAULT 'es',
    nombre_sitio VARCHAR(150) DEFAULT 'Intranet Camintra',
    email_soporte VARCHAR(255) DEFAULT '',
    tiempo_sesion_minutos INTEGER DEFAULT 60,
    requiere_autenticacion BOOLEAN DEFAULT TRUE,
    mostrar_dashboard BOOLEAN DEFAULT TRUE,
    mostrar_carousel BOOLEAN DEFAULT FALSE,
    pass_longitud_minima INTEGER DEFAULT 6,
    pass_caducidad_dias INTEGER DEFAULT 0,
    modo_mantenimiento BOOLEAN DEFAULT FALSE,
    max_intentos_login INTEGER DEFAULT 15,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- La parametrización es única: sin esto una fila nueva pasaría
    -- desapercibida y la API leería una cualquiera.
    CONSTRAINT chk_plataforma_fila_unica CHECK (id = 1)
);

INSERT INTO plataforma (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
