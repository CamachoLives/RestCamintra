/**
 * Crea (o promueve) el usuario administrador de la intranet.
 *
 *   node scripts/seed-admin.js <email> <password> [nombre]
 *
 * Si el email ya existe solo lo promueve a rol 'admin' sin tocar su clave.
 */
const bcrypt = require('bcrypt');
const db = require('../src/database/index');
const config = require('../src/config/index');

const [, , email, password, ...nombreParts] = process.argv;
const nombre = nombreParts.join(' ') || 'Administrador';

const seedAdmin = async () => {
  if (!email) {
    console.error('Uso: node scripts/seed-admin.js <email> <password> [nombre]');
    process.exitCode = 1;
    return;
  }

  try {
    const existente = await db.query(
      'SELECT id, rol FROM usuarios WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (existente.rows[0]) {
      if (existente.rows[0].rol === 'admin') {
        console.log(`ℹ️  ${email} ya es administrador`);
        return;
      }

      await db.query(`UPDATE usuarios SET rol = 'admin' WHERE id = $1`, [
        existente.rows[0].id,
      ]);
      console.log(`✅ ${email} promovido a administrador`);
      return;
    }

    if (!password) {
      console.error('❌ El usuario no existe: hace falta la contraseña');
      process.exitCode = 1;
      return;
    }

    const hash = await bcrypt.hash(password, config.bcryptRounds);
    const creado = await db.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol)
       VALUES ($1, $2, $3, 'admin')
       RETURNING id, nombre, email, rol`,
      [nombre, email.toLowerCase().trim(), hash]
    );

    console.log('✅ Administrador creado:', creado.rows[0]);
  } catch (error) {
    console.error('❌ No se pudo crear el administrador:', error.message);
    process.exitCode = 1;
  } finally {
    await db.closePool();
  }
};

seedAdmin();
