const js = require('@eslint/js');
const prettier = require('eslint-config-prettier');

/**
 * ESLint revisa la calidad del código; el formato lo decide Prettier.
 *
 * Antes las dos herramientas se contradecían: eslint exigía
 * comma-dangle always-multiline y el .prettierrc pedía trailingComma es5,
 * así que `npm run lint:fix` y `npm run format` se deshacían mutuamente.
 * eslint-config-prettier apaga las reglas de estilo y deja una sola
 * fuente de verdad.
 */
const globalesNode = {
  console: 'readonly',
  process: 'readonly',
  Buffer: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  module: 'readonly',
  require: 'readonly',
  exports: 'readonly',
  global: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
};

const globalesJest = {
  describe: 'readonly',
  it: 'readonly',
  test: 'readonly',
  expect: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
  jest: 'readonly',
};

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: globalesNode,
    },
    rules: {
      // Nombres
      camelcase: ['error', { properties: 'never' }],
      // express.Router() y los servicios tipo AuthServices.Login() se
      // llaman sin new a propósito; lo que sí se exige es que todo lo
      // invocado con new empiece en mayúscula.
      'new-cap': ['error', { capIsNew: false }],

      // Buenas prácticas
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // Manejo de errores
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',

      // Async/await
      'require-await': 'error',
      'no-async-promise-executor': 'error',
    },
  },
  {
    // Las pruebas corren en Jest, que inyecta sus globales
    files: ['tests/**/*.js'],
    languageOptions: { globals: { ...globalesNode, ...globalesJest } },
  },
  // Siempre al final: apaga las reglas de formato que chocan con Prettier
  prettier,
  {
    ignores: ['node_modules/', 'dist/', 'build/', 'coverage/', '*.min.js'],
  },
];
