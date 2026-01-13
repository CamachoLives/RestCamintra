const { ObjectId } = require('mongodb');
const { database } = require('../database/index');
const { createError } = require('../middleware/errorHandler');
const debug = require('debug')('app:activities-service');

const COLLECTION = 'activities';

const getAll = async () => {
  try {
    const collection = await database(COLLECTION);
    const activities = await collection.find({}).toArray();
    debug(`Retrieved ${activities.length} activities`);
    return activities;
  } catch (error) {
    debug('Error getting all activities:', error);
    throw createError('Error al obtener las actividades', 500);
  }
};

const getById = async id => {
  try {
    if (!ObjectId.isValid(id)) {
      throw createError('ID de actividad inválido', 400);
    }

    const collection = await database(COLLECTION);
    const activity = await collection.findOne({ _id: new ObjectId(id) });

    if (!activity) {
      return null;
    }

    debug(`Retrieved activity with ID: ${id}`);
    return activity;
  } catch (error) {
    debug('Error getting activity by ID:', error);
    if (error.isOperational) {
      throw error;
    }
    throw createError('Error al obtener la actividad', 500);
  }
};

const create = async activityData => {
  try {
    if (!activityData || Object.keys(activityData).length === 0) {
      throw createError('Datos de actividad requeridos', 400);
    }

    const collection = await database(COLLECTION);
    const result = await collection.insertOne({
      ...activityData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (!result.insertedId) {
      throw createError('Error al crear la actividad', 500);
    }

    const newActivity = await getById(result.insertedId.toString());
    debug(`Created activity with ID: ${result.insertedId}`);
    return newActivity;
  } catch (error) {
    debug('Error creating activity:', error);
    if (error.isOperational) {
      throw error;
    }
    throw createError('Error al crear la actividad', 500);
  }
};

const update = async (id, updateData) => {
  try {
    if (!ObjectId.isValid(id)) {
      throw createError('ID de actividad inválido', 400);
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      throw createError('Datos de actualización requeridos', 400);
    }

    const collection = await database(COLLECTION);
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' },
    );

    if (!result.value) {
      return null;
    }

    debug(`Updated activity with ID: ${id}`);
    return result.value;
  } catch (error) {
    debug('Error updating activity:', error);
    if (error.isOperational) {
      throw error;
    }
    throw createError('Error al actualizar la actividad', 500);
  }
};

const deleteActivity = async id => {
  try {
    if (!ObjectId.isValid(id)) {
      throw createError('ID de actividad inválido', 400);
    }

    const collection = await database(COLLECTION);
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return false;
    }

    debug(`Deleted activity with ID: ${id}`);
    return true;
  } catch (error) {
    debug('Error deleting activity:', error);
    if (error.isOperational) {
      throw error;
    }
    throw createError('Error al eliminar la actividad', 500);
  }
};

module.exports.activitiesService = {
  getAll,
  getById,
  create,
  update,
  delete: deleteActivity,
};
