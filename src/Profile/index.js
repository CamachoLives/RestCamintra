const express = require('express');
const { profileController } = require('./controller');
const { profileSchemas, validateRequest } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/security');
const router = express.Router();

module.exports.Profile = app => {
  // Rutas públicas
  router.get('/search', profileController.searchProfiles);
  router.get('/all', profileController.getAllProfiles);

  // Rutas protegidas
  router
    .post(
      '/',
      authenticateToken,
      validateRequest(profileSchemas.createProfile),
      profileController.createProfile,
    )
    .get('/me', authenticateToken, profileController.getMyProfile)
    .get('/:userId', authenticateToken, profileController.getProfile)
    .put(
      '/me',
      authenticateToken,
      validateRequest(profileSchemas.updateProfile),
      profileController.updateProfile,
    )
    .put(
      '/:userId',
      authenticateToken,
      validateRequest(profileSchemas.updateProfile),
      profileController.updateProfile,
    )
    .put(
      '/:userId/image',
      authenticateToken,
      profileController.updateProfileImage,
    )
    .delete('/me', authenticateToken, profileController.deleteProfile)
    .delete('/:userId', authenticateToken, profileController.deleteProfile);

  app.use('/api/profile', router);
};

