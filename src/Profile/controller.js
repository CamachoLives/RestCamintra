// const debug = require('debug')('app:profile-controller');
const { profileService } = require('./services');
const { response } = require('../common/response');
const { createError } = require('../middleware/errorHandler');

module.exports.profileController = {
  createProfile: async (req, res, next) => {
    try {
      const profileData = req.body;
      const userId = req.user?.id || profileData.userId;

      if (!userId) {
        throw createError('ID de usuario requerido', 400);
      }

      const newProfile = await profileService.createProfile({
        ...profileData,
        userId,
      });

      response.success(res, 'Perfil creado exitosamente', 201, newProfile);
    } catch (error) {
      next(error);
    }
  },

  getProfile: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id;

      // Si no se especifica userId, usar el del usuario autenticado
      const targetUserId = userId || currentUserId;

      if (!targetUserId) {
        throw createError('ID de usuario requerido', 400);
      }

      const profile = await profileService.getProfileByUserId(targetUserId);

      if (!profile) {
        throw createError('Perfil no encontrado', 404);
      }

      response.success(res, 'Perfil obtenido exitosamente', 200, profile);
    } catch (error) {
      next(error);
    }
  },

  getMyProfile: async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw createError('Usuario no autenticado', 401);
      }

      const profile = await profileService.getOrCreateProfile(userId);
      response.success(res, 'Perfil obtenido exitosamente', 200, profile);
    } catch (error) {
      next(error);
    }
  },

  updateProfile: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id;
      const updateData = req.body;

      // Verificar que el usuario solo pueda actualizar su propio perfil
      if (userId && userId !== currentUserId?.toString()) {
        throw createError(
          'No tienes permisos para actualizar este perfil',
          403
        );
      }

      const targetUserId = userId || currentUserId;

      if (!targetUserId) {
        throw createError('ID de usuario requerido', 400);
      }

      if (!updateData || Object.keys(updateData).length === 0) {
        throw createError('Datos de actualización requeridos', 400);
      }

      const updatedProfile = await profileService.updateProfile(
        targetUserId,
        updateData
      );
      response.success(
        res,
        'Perfil actualizado exitosamente',
        200,
        updatedProfile
      );
    } catch (error) {
      next(error);
    }
  },

  updateProfileImage: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id;
      const { imageUrl } = req.body;

      // Verificar que el usuario solo pueda actualizar su propia imagen
      if (userId && userId !== currentUserId?.toString()) {
        throw createError(
          'No tienes permisos para actualizar esta imagen',
          403
        );
      }

      const targetUserId = userId || currentUserId;

      if (!targetUserId) {
        throw createError('ID de usuario requerido', 400);
      }

      if (!imageUrl) {
        throw createError('URL de imagen requerida', 400);
      }

      const updatedProfile = await profileService.updateProfileImage(
        targetUserId,
        imageUrl
      );
      response.success(
        res,
        'Imagen de perfil actualizada exitosamente',
        200,
        updatedProfile
      );
    } catch (error) {
      next(error);
    }
  },

  deleteProfile: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id;

      // Verificar que el usuario solo pueda eliminar su propio perfil
      if (userId && userId !== currentUserId?.toString()) {
        throw createError('No tienes permisos para eliminar este perfil', 403);
      }

      const targetUserId = userId || currentUserId;

      if (!targetUserId) {
        throw createError('ID de usuario requerido', 400);
      }

      await profileService.deleteProfile(targetUserId);
      response.success(res, 'Perfil eliminado exitosamente', 200);
    } catch (error) {
      next(error);
    }
  },

  getAllProfiles: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, area } = req.query;

      const profiles = await profileService.getAllProfiles({
        page: parseInt(page),
        limit: parseInt(limit),
        area,
      });

      response.success(res, 'Perfiles obtenidos exitosamente', 200, {
        profiles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: profiles.length,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  searchProfiles: async (req, res, next) => {
    try {
      const { q, area, page = 1, limit = 10 } = req.query;

      if (!q && !area) {
        throw createError('Término de búsqueda o área requerida', 400);
      }

      const profiles = await profileService.getAllProfiles({
        page: parseInt(page),
        limit: parseInt(limit),
        area,
        search: q,
      });

      response.success(res, 'Búsqueda de perfiles completada', 200, {
        profiles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: profiles.length,
        },
        searchTerm: q,
        area,
      });
    } catch (error) {
      next(error);
    }
  },
};
