// Entorno fijo para las pruebas: ni el .env de la máquina ni el de CI
// deberían cambiar el resultado de un test.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto-solo-para-pruebas';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_ROUNDS = '4'; // bcrypt con 10 rondas hace lentas las pruebas
