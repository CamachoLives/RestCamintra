/** Configuración de Jest para la API de la intranet.
 *
 * Las pruebas viven en /tests con la misma estructura de /src, así que
 * `tests/common/response.test.js` cubre `src/common/response.js`.
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    // Los index.js solo montan routers y los repositorios hablan con
    // PostgreSQL: se cubren con pruebas de integración, no unitarias.
    '!src/**/index.js',
    '!src/**/repository.js',
  ],
  coverageDirectory: 'coverage',
  clearMocks: true,
  restoreMocks: true,
  setupFiles: ['<rootDir>/tests/setup.js'],
};
