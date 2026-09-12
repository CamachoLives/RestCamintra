-- Directorio corporativo: departamentos y ficha del colaborador

CREATE TABLE IF NOT EXISTS departamentos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT DEFAULT '',
    color_hex VARCHAR(7) DEFAULT '#374151',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS colaboradores (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL UNIQUE,
    departamento_id INTEGER,
    cargo VARCHAR(120) NOT NULL DEFAULT 'Sin asignar',
    extension VARCHAR(20) DEFAULT '',
    celular VARCHAR(20) DEFAULT '',
    sede VARCHAR(100) DEFAULT '',
    fecha_ingreso DATE,
    jefe_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_colaboradores_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_colaboradores_departamento
        FOREIGN KEY (departamento_id) REFERENCES departamentos(id) ON DELETE SET NULL,
    CONSTRAINT fk_colaboradores_jefe
        FOREIGN KEY (jefe_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_colaboradores_usuario ON colaboradores(usuario_id);
CREATE INDEX IF NOT EXISTS idx_colaboradores_departamento ON colaboradores(departamento_id);
CREATE INDEX IF NOT EXISTS idx_colaboradores_cargo ON colaboradores(cargo);

INSERT INTO departamentos (nombre, descripcion, color_hex)
VALUES
    ('Tecnología', 'Desarrollo, infraestructura y soporte', '#2563eb'),
    ('Talento Humano', 'Gestión de personas y bienestar', '#16a34a'),
    ('Operaciones', 'Ejecución y logística del negocio', '#ea580c'),
    ('Comercial', 'Ventas, clientes y relaciones', '#9333ea'),
    ('Administración', 'Finanzas, contabilidad y compras', '#0891b2')
ON CONFLICT (nombre) DO NOTHING;
