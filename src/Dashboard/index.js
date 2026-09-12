const express = require('express');
const { dashboardController } = require('./controller');
const { authenticateToken } = require('../middleware/security');
const router = express.Router();

module.exports.Dashboard = app => {
  router
    .get('/', authenticateToken, dashboardController.resumen)
    .get('/indicadores', authenticateToken, dashboardController.indicadores);

  app.use('/api/dashboard', router);
};
