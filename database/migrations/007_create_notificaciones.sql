-- Notificaciones internas (campanita del header)

CREATE TABLE IF NOT EXISTS notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    mensaje VARCHAR(400) DEFAULT '',
    tipo VARCHAR(20) NOT NULL DEFAULT 'info',
    enlace VARCHAR(300) DEFAULT '',
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_notificaciones_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_notificaciones_tipo
        CHECK (tipo IN ('info', 'comunicado', 'evento', 'documento', 'alerta'))
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id, leida);
CREATE INDEX IF NOT EXISTS idx_notificaciones_fecha ON notificaciones(created_at DESC);
