const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuración de la base de datos
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'calendar',
});

const MIGRATIONS_DIR = path.join(__dirname, 'database', 'migrations');

// Tabla de control: guarda qué migraciones ya se aplicaron
const ensureMigrationsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      nombre VARCHAR(255) PRIMARY KEY,
      aplicada_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
};

const getApplied = async () => {
  const result = await pool.query('SELECT nombre FROM schema_migrations');
  return new Set(result.rows.map(row => row.nombre));
};

const runMigrations = async () => {
  try {
    await ensureMigrationsTable();
    const applied = await getApplied();

    const pending = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort()
      .filter(file => !applied.has(file));

    if (pending.length === 0) {
      console.log('✅ Base de datos al día, no hay migraciones pendientes');
      return;
    }

    for (const file of pending) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      console.log(`▶️  Aplicando ${file}...`);

      await pool.query('BEGIN');
      try {
        await pool.query(sql);
        await pool.query(
          'INSERT INTO schema_migrations (nombre) VALUES ($1)',
          [file]
        );
        await pool.query('COMMIT');
        console.log(`✅ ${file} aplicada`);
      } catch (error) {
        await pool.query('ROLLBACK');
        throw new Error(`Falló ${file}: ${error.message}`);
      }
    }

    console.log(`🎉 ${pending.length} migración(es) aplicada(s)`);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error(
        '❌ Error de conexión. Verifica que PostgreSQL esté ejecutándose'
      );
    } else if (error.code === '28P01') {
      console.error('❌ Error de autenticación. Revisa DB_USER y DB_PASSWORD');
    } else if (error.code === '3D000') {
      console.error(`❌ La base de datos "${process.env.DB_NAME}" no existe`);
    } else {
      console.error(`❌ ${error.message}`);
    }
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

runMigrations();
