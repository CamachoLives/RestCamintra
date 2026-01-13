require('dotenv').config();

const config = {
  // Database Configuration
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: parseInt(process.env.DB_PORT, 10) || 5432,
  dbUser: process.env.DB_USER || 'postgres',
  dbPassword: process.env.DB_PASSWORD || 'password',
  dbName: process.env.DB_NAME || 'calendar',

  // JWT Configuration
  jwtSecret:
    process.env.JWT_SECRET ||
    'your_super_secret_jwt_key_here_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',

  // Server Configuration
  port: parseInt(process.env.PORT, 10) || 7000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Security Configuration
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,

  // CORS Configuration
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',

  // Validation
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// Validar variables críticas en producción
if (config.isProduction) {
  const requiredVars = ['JWT_SECRET', 'DB_PASSWORD'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`,
    );
  }
}

module.exports = config;
