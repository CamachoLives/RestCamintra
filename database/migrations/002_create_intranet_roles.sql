-- Roles y control de acceso de la intranet
-- Los usuarios existentes quedan como 'colaborador' por defecto.

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS rol VARCHAR(20) NOT NULL DEFAULT 'colaborador';

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMP WITH TIME ZONE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_usuarios_rol'
    ) THEN
        ALTER TABLE usuarios
            ADD CONSTRAINT chk_usuarios_rol
            CHECK (rol IN ('admin', 'editor', 'colaborador'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);
