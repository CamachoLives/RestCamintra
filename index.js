const express = require('express');
const cors = require('cors');
require('dotenv').config();

const debug = require('debug')('app:main');
const app = express();

// Security and middleware imports
const {
  generalRateLimit,
  helmetConfig,
  sanitizeLogs,
} = require('./src/middleware/security');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

// Modules
const { configuracion } = require('./src/configuracion/');
const { Auth } = require('./src/Auth/');
const { activities } = require('./src/Activities/index');
const { Users } = require('./src/Users/index');
const { Profile } = require('./src/Profile/index');
const listEndpoints = require('express-list-endpoints');

// Security middleware
app.use(helmetConfig);
app.use(generalRateLimit);
app.use(sanitizeLogs);

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Apps
Auth(app);
Users(app);
configuracion(app);
//activities(app);
//Profile(app);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  debug(`Server is running on port: ${PORT}`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
