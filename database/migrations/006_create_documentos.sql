-- Wiki / documentos internos

CREATE TABLE IF NOT EXISTS documentos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    resumen VARCHAR(400) DEFAULT '',
    contenido TEXT NOT NULL,
    categoria VARCHAR(80) NOT NULL DEFAULT 'General',
    etiquetas TEXT[] DEFAULT '{}',
    version INTEGER NOT NULL DEFAULT 1,
    estado VARCHAR(15) NOT NULL DEFAULT 'borrador',
    departamento_id INTEGER,
    autor_id INTEGER NOT NULL,
    vistas INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_documentos_departamento
        FOREIGN KEY (departamento_id) REFERENCES departamentos(id) ON DELETE SET NULL,
    CONSTRAINT fk_documentos_autor
        FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_documentos_estado
        CHECK (estado IN ('borrador', 'publicado', 'archivado'))
);

CREATE INDEX IF NOT EXISTS idx_documentos_categoria ON documentos(categoria);
CREATE INDEX IF NOT EXISTS idx_documentos_estado ON documentos(estado);
CREATE INDEX IF NOT EXISTS idx_documentos_etiquetas ON documentos USING GIN (etiquetas);
