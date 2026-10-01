// Entorno fijo para las pruebas: ni el .env de la máquina ni el de CI
// deberían cambiar el resultado de un test.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto-solo-para-pruebas';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_ROUNDS = '4'; // bcrypt con 10 rondas hace lentas las pruebas

// dotenv v17 anuncia en consola cada vez que inyecta el .env; en las
// pruebas solo es ruido (y las variables críticas ya están fijadas arriba,
// dotenv no sobreescribe lo que ya existe).
process.env.DOTENV_CONFIG_QUIET = 'true';
