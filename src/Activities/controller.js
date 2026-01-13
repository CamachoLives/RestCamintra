// const debug = require('debug')('app:activities-controller');
const { activitiesService } = require('./services');
const { response } = require('../common/response');
const { createError } = require('../middleware/errorHandler');

module.exports.activitiesController = {
  getAllActivities: async (req, res, next) => {
    try {
      const activities = await activitiesService.getAll();
      response.success(
        res,
        'Actividades obtenidas exitosamente',
        200,
        activities,
      );
    } catch (error) {
      next(error);
    }
  },
//
  getActivityById: async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError('ID de actividad requerido', 400);
      }

      const activity = await activitiesService.getById(id);

      if (!activity) {
        throw createError('Actividad no encontrada', 404);
      }

      response.success(res, 'Actividad obtenida exitosamente', 200, activity);
    } catch (error) {
      next(error);
    }
  },

  createActivity: async (req, res, next) => {
    try {
      const activityData = req.body;

      if (!activityData || Object.keys(activityData).length === 0) {
        throw createError('Datos de actividad requeridos', 400);
      }

      const newActivity = await activitiesService.create(activityData);
      response.success(res, 'Actividad creada exitosamente', 201, newActivity);
    } catch (error) {
      next(error);
    }
  },

  updateActivity: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        throw createError('ID de actividad requerido', 400);
      }

      if (!updateData || Object.keys(updateData).length === 0) {
        throw createError('Datos de actualización requeridos', 400);
      }

      const updatedActivity = await activitiesService.update(id, updateData);

      if (!updatedActivity) {
        throw createError('Actividad no encontrada', 404);
      }

      response.success(
        res,
        'Actividad actualizada exitosamente',
        200,
        updatedActivity,
      );
    } catch (error) {
      next(error);
    }
  },

  deleteActivity: async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError('ID de actividad requerido', 400);
      }

      const deleted = await activitiesService.delete(id);

      if (!deleted) {
        throw createError('Actividad no encontrada', 404);
      }

      response.success(res, 'Actividad eliminada exitosamente', 200);
    } catch (error) {
      next(error);
    }
  },
};
