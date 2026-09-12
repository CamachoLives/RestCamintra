-- Calendario corporativo

CREATE TABLE IF NOT EXISTS eventos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT DEFAULT '',
    tipo VARCHAR(20) NOT NULL DEFAULT 'evento',
    inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fin TIMESTAMP WITH TIME ZONE,
    todo_el_dia BOOLEAN NOT NULL DEFAULT FALSE,
    lugar VARCHAR(150) DEFAULT '',
    color_hex VARCHAR(7) DEFAULT '#2563eb',
    departamento_id INTEGER,
    creado_por INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_eventos_departamento
        FOREIGN KEY (departamento_id) REFERENCES departamentos(id) ON DELETE SET NULL,
    CONSTRAINT fk_eventos_creador
        FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_eventos_tipo
        CHECK (tipo IN ('evento', 'capacitacion', 'reunion', 'festivo', 'cumpleanos')),
    CONSTRAINT chk_eventos_rango
        CHECK (fin IS NULL OR fin >= inicio)
);

CREATE INDEX IF NOT EXISTS idx_eventos_inicio ON eventos(inicio);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo ON eventos(tipo);
CREATE INDEX IF NOT EXISTS idx_eventos_departamento ON eventos(departamento_id);
