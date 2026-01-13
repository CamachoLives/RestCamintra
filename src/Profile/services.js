const { profileRepository } = require('./repository');
const { createError } = require('../middleware/errorHandler');
const debug = require('debug')('app:profile-service');

const createProfile = async profileData => {
  try {
    const { userId } = profileData;

    if (!userId) {
      throw createError('ID de usuario requerido', 400);
    }

    // Verificar si ya existe un perfil para este usuario
    const existingProfile = await profileRepository.getProfileByUserId(userId);
    if (existingProfile) {
      throw createError('El usuario ya tiene un perfil creado', 409);
    }

    const newProfile = await profileRepository.createProfile(profileData);
    debug(`Profile created successfully for user: ${userId}`);
    return newProfile;
  } catch (error) {
    debug('Error creating profile:', error);
    if (error.isOperational) {
      throw error;
    }
    throw createError('Error al crear el perfil', 500);
  }
};

const getProfileByUserId = async userId => {
  try {
    if (!userId) {
      throw createError('ID de usuario requerido', 400);
    }

    const profile = await profileRepository.getProfileByUserId(userId);

    if (!profile) {
      return null;
    }

    debug(`Profile retrieved for user: ${userId}`);
    return profile;
  } catch (error) {
    debug('Error getting profile by user ID:', error);
    if (error.isOperational) {
      throw error;
    }
    throw createError('Error al obtener el perfil', 500);
  }
};

const updateProfile = async (userId, updateData) => {
  try {
    if (!userId) {
      throw createError('ID de usuario requerido', 400);
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      throw createError('Datos de actualización requeridos', 400);
    }

    const updatedProfile = await profileRepository.updateProfile(
      userId,
      updateData,
    );

    if (!updatedProfile) {
      throw createError('Perfil no encontrado', 404);
    }

    debug(`Profile updated for user: ${userId}`);
    return updatedProfile;
  } catch (error) {
    debug('Error updating profile:', error);
    if (error.isOperational) {
      throw error;
    }
    throw createError('Error al actualizar el perfil', 500);
  }
};

const updateProfileImage = async (userId, imageUrl) => {
  try {
    if (!userId) {
      throw createError('ID de usuario requerido', 400);
    }

    if (!imageUrl) {
      throw createError('URL de imagen requerida', 400);
    }

    const updatedProfile = await profileRepository.updateProfileImage(
      userId,
      imageUrl,
    );

    if (!updatedProfile) {
      throw createError('Perfil no encontrado', 404);
    }

    debug(`Profile image updated for user: ${userId}`);
    return updatedProfile;
  } catch (error) {
    debug('Error updating profile image:', error);
    if (error.isOperational) {
      throw error;
    }
    throw createError('Error al actualizar la imagen del perfil', 500);
  }
};

const deleteProfile = async userId => {
  try {
    if (!userId) {
      throw createError('ID de usuario requerido', 400);
    }

    const deleted = await profileRepository.deleteProfile(userId);

    if (!deleted) {
      throw createError('Perfil no encontrado', 404);
    }

    debug(`Profile deleted for user: ${userId}`);
    return true;
  } catch (error) {
    debug('Error deleting profile:', error);
    if (error.isOperational) {
      throw error;
    }
    throw createError('Error al eliminar el perfil', 500);
  }
};

const getAllProfiles = async options => {
  try {
    const profiles = await profileRepository.getAllProfiles(options);
    debug(`Retrieved ${profiles.length} profiles`);
    return profiles;
  } catch (error) {
    debug('Error getting all profiles:', error);
    if (error.isOperational) {
      throw error;
    }
    throw createError('Error al obtener los perfiles', 500);
  }
};

const getOrCreateProfile = async userId => {
  try {
    if (!userId) {
      throw createError('ID de usuario requerido', 400);
    }

    let profile = await profileRepository.getProfileByUserId(userId);

    if (!profile) {
      // Crear perfil básico si no existe
      profile = await profileRepository.createProfile({
        userId,
        biografia: '',
        area: 'Sin especificar',
        telefono: '',
        ubicacion: '',
        sitioWeb: '',
        redesSociales: {},
      });
      debug(`Basic profile created for user: ${userId}`);
    }

    return profile;
  } catch (error) {
    debug('Error getting or creating profile:', error);
    if (error.isOperational) {
      throw error;
    }
    throw createError('Error al obtener o crear el perfil', 500);
  }
};

module.exports.profileService = {
  createProfile,
  getProfileByUserId,
  updateProfile,
  updateProfileImage,
  deleteProfile,
  getAllProfiles,
  getOrCreateProfile,
};

