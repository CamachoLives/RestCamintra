const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de la base de datos
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'calendar',
});

async function runMigration() {
  try {
    // Leer el archivo SQL
    const migrationPath = path.join(
      __dirname,
      'database',
      'migrations',
      '001_create_user_profiles_table.sql'
    );
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    // Ejecutar la migración
    await pool.query(sqlContent);

    // Verificar que la tabla se creó correctamente
    const result = await pool.query(`
      SELECT table_name, column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' 
      ORDER BY ordinal_position
    `);

    result.rows.forEach(row => {
      console.log(
        `  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`
      );
    });
  } catch (error) {
    if (error.code === '42P07') {
      console.log('ℹ️  La tabla user_profiles ya existe');
    } else if (error.code === 'ECONNREFUSED') {
      console.log(
        '❌ Error de conexión a la base de datos. Verifica que PostgreSQL esté ejecutándose'
      );
    } else if (error.code === '28P01') {
      console.log(
        '❌ Error de autenticación. Verifica las credenciales de la base de datos'
      );
    } else if (error.code === '3D000') {
      console.log(
        '❌ La base de datos no existe. Crea la base de datos calendario_db primero'
      );
    }
  } finally {
    await pool.end();
  }
}

// Ejecutar migración
runMigration();

