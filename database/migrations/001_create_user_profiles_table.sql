-- Crear tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    biografia TEXT DEFAULT '',
    area VARCHAR(100) NOT NULL DEFAULT 'Sin especificar',
    telefono VARCHAR(20) DEFAULT '',
    ubicacion VARCHAR(100) DEFAULT '',
    sitio_web VARCHAR(255) DEFAULT '',
    imagen_url VARCHAR(500) DEFAULT '',
    redes_sociales JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraint
    CONSTRAINT fk_user_profiles_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES usuarios(id) 
        ON DELETE CASCADE
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_area ON user_profiles(area);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at ON user_profiles(updated_at);

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();

-- Comentarios en la tabla y columnas
COMMENT ON TABLE user_profiles IS 'Perfiles extendidos de usuarios con información adicional';
COMMENT ON COLUMN user_profiles.user_id IS 'ID del usuario (FK a usuarios.id)';
COMMENT ON COLUMN user_profiles.biografia IS 'Biografía o descripción personal del usuario';
COMMENT ON COLUMN user_profiles.area IS 'Área o departamento al que pertenece el usuario';
COMMENT ON COLUMN user_profiles.telefono IS 'Número de teléfono del usuario';
COMMENT ON COLUMN user_profiles.ubicacion IS 'Ubicación geográfica del usuario';
COMMENT ON COLUMN user_profiles.sitio_web IS 'Sitio web personal del usuario';
COMMENT ON COLUMN user_profiles.imagen_url IS 'URL de la imagen de perfil del usuario';
COMMENT ON COLUMN user_profiles.redes_sociales IS 'Enlaces a redes sociales en formato JSON';
COMMENT ON COLUMN user_profiles.created_at IS 'Fecha de creación del perfil';
COMMENT ON COLUMN user_profiles.updated_at IS 'Fecha de última actualización del perfil';

