const express = require('express');
const { activitiesController } = require('./controller');
const { authenticateToken } = require('../middleware/security');
const router = express.Router();

module.exports.activities = app => {
  // Rutas públicas (si las hay)

  // Rutas protegidas
  router
    .get('/', activitiesController.getAllActivities)
    .get('/:id', activitiesController.getActivityById)
    .post('/', authenticateToken, activitiesController.createActivity)
    .put('/:id', authenticateToken, activitiesController.updateActivity)
    .delete('/:id', authenticateToken, activitiesController.deleteActivity);

  app.use('/api/activities', router);
};
