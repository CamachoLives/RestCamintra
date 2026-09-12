-- Comunicados: el tablon de noticias de la intranet

CREATE TABLE IF NOT EXISTS comunicado_categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL UNIQUE,
    color_hex VARCHAR(7) DEFAULT '#374151',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comunicados (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    resumen VARCHAR(400) DEFAULT '',
    contenido TEXT NOT NULL,
    categoria_id INTEGER,
    autor_id INTEGER NOT NULL,
    imagen_url VARCHAR(500) DEFAULT '',
    prioridad VARCHAR(10) NOT NULL DEFAULT 'normal',
    estado VARCHAR(15) NOT NULL DEFAULT 'borrador',
    fijado BOOLEAN NOT NULL DEFAULT FALSE,
    publicado_en TIMESTAMP WITH TIME ZONE,
    expira_en TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_comunicados_categoria
        FOREIGN KEY (categoria_id) REFERENCES comunicado_categorias(id) ON DELETE SET NULL,
    CONSTRAINT fk_comunicados_autor
        FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_comunicados_prioridad
        CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),
    CONSTRAINT chk_comunicados_estado
        CHECK (estado IN ('borrador', 'publicado', 'archivado'))
);

-- Quien ya leyo que comunicado (para el badge de "no leidos")
CREATE TABLE IF NOT EXISTS comunicado_lecturas (
    comunicado_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    leido_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    PRIMARY KEY (comunicado_id, usuario_id),
    CONSTRAINT fk_lecturas_comunicado
        FOREIGN KEY (comunicado_id) REFERENCES comunicados(id) ON DELETE CASCADE,
    CONSTRAINT fk_lecturas_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comunicados_estado ON comunicados(estado);
CREATE INDEX IF NOT EXISTS idx_comunicados_publicado ON comunicados(publicado_en DESC);
CREATE INDEX IF NOT EXISTS idx_comunicados_categoria ON comunicados(categoria_id);
CREATE INDEX IF NOT EXISTS idx_comunicados_autor ON comunicados(autor_id);
CREATE INDEX IF NOT EXISTS idx_lecturas_usuario ON comunicado_lecturas(usuario_id);

INSERT INTO comunicado_categorias (nombre, color_hex)
VALUES
    ('General', '#374151'),
    ('Talento Humano', '#16a34a'),
    ('Tecnología', '#2563eb'),
    ('Bienestar', '#db2777'),
    ('Urgente', '#dc2626')
ON CONFLICT (nombre) DO NOTHING;
