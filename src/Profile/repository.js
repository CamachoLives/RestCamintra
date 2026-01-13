const { query } = require('../database/index');
const debug = require('debug')('app:profile-repository');

const createProfile = async profileData => {
  try {
    const {
      userId,
      biografia,
      area,
      telefono,
      ubicacion,
      sitioWeb,
      redesSociales,
    } = profileData;

    const result = await query(
      `INSERT INTO user_profiles 
       (user_id, biografia, area, telefono, ubicacion, sitio_web, redes_sociales, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
       RETURNING *`,
      [
        userId,
        biografia || '',
        area,
        telefono || '',
        ubicacion || '',
        sitioWeb || '',
        JSON.stringify(redesSociales || {}),
      ]
    );

    debug(`Profile created for user: ${userId}`);
    return result.rows[0];
  } catch (error) {
    debug('Error creating profile:', error);
    throw error;
  }
};

const getProfileByUserId = async userId => {
  try {
    const result = await query(
      `SELECT up.*, u.nombre, u.email 
       FROM user_profiles up 
       JOIN usuarios u ON up.user_id = u.id 
       WHERE up.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const profile = result.rows[0];

    // Parse redes sociales JSON
    if (profile.redes_sociales) {
      try {
        profile.redes_sociales = JSON.parse(profile.redes_sociales);
      } catch {
        profile.redes_sociales = {};
      }
    }

    debug(`Profile retrieved for user: ${userId}`);
    return profile;
  } catch (error) {
    debug('Error getting profile by user ID:', error);
    throw error;
  }
};

const updateProfile = async (userId, updateData) => {
  try {
    const { biografia, area, telefono, ubicacion, sitioWeb, redesSociales } =
      updateData;

    const setClause = [];
    const values = [];
    let paramCount = 1;

    if (biografia !== undefined) {
      setClause.push(`biografia = $${paramCount}`);
      values.push(biografia);
      paramCount++;
    }

    if (area !== undefined) {
      setClause.push(`area = $${paramCount}`);
      values.push(area);
      paramCount++;
    }

    if (telefono !== undefined) {
      setClause.push(`telefono = $${paramCount}`);
      values.push(telefono);
      paramCount++;
    }

    if (ubicacion !== undefined) {
      setClause.push(`ubicacion = $${paramCount}`);
      values.push(ubicacion);
      paramCount++;
    }

    if (sitioWeb !== undefined) {
      setClause.push(`sitio_web = $${paramCount}`);
      values.push(sitioWeb);
      paramCount++;
    }

    if (redesSociales !== undefined) {
      setClause.push(`redes_sociales = $${paramCount}`);
      values.push(JSON.stringify(redesSociales));
      paramCount++;
    }

    if (setClause.length === 0) {
      throw new Error('No fields to update');
    }

    setClause.push('updated_at = NOW()');
    values.push(userId);

    const result = await query(
      `UPDATE user_profiles 
       SET ${setClause.join(', ')} 
       WHERE user_id = $${paramCount} 
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    const profile = result.rows[0];

    // Parse redes sociales JSON
    if (profile.redes_sociales) {
      try {
        profile.redes_sociales = JSON.parse(profile.redes_sociales);
      } catch {
        profile.redes_sociales = {};
      }
    }

    debug(`Profile updated for user: ${userId}`);
    return profile;
  } catch (error) {
    debug('Error updating profile:', error);
    throw error;
  }
};

const updateProfileImage = async (userId, imageUrl) => {
  try {
    const result = await query(
      `UPDATE user_profiles 
       SET imagen_url = $1, updated_at = NOW() 
       WHERE user_id = $2 
       RETURNING *`,
      [imageUrl, userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    debug(`Profile image updated for user: ${userId}`);
    return result.rows[0];
  } catch (error) {
    debug('Error updating profile image:', error);
    throw error;
  }
};

const deleteProfile = async userId => {
  try {
    const result = await query(
      'DELETE FROM user_profiles WHERE user_id = $1 RETURNING *',
      [userId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    debug(`Profile deleted for user: ${userId}`);
    return true;
  } catch (error) {
    debug('Error deleting profile:', error);
    throw error;
  }
};

const getAllProfiles = async (options = {}) => {
  try {
    const { page = 1, limit = 10, area } = options;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const values = [];
    let paramCount = 1;

    if (area) {
      whereClause = 'WHERE up.area ILIKE $1';
      values.push(`%${area}%`);
      paramCount++;
    }

    const result = await query(
      `SELECT up.*, u.nombre, u.email 
       FROM user_profiles up 
       JOIN usuarios u ON up.user_id = u.id 
       ${whereClause}
       ORDER BY up.updated_at DESC 
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...values, limit, offset]
    );

    // Parse redes sociales JSON for each profile
    const profiles = result.rows.map(profile => {
      if (profile.redes_sociales) {
        try {
          profile.redes_sociales = JSON.parse(profile.redes_sociales);
        } catch {
          profile.redes_sociales = {};
        }
      }
      return profile;
    });

    debug(`Retrieved ${profiles.length} profiles`);
    return profiles;
  } catch (error) {
    debug('Error getting all profiles:', error);
    throw error;
  }
};

module.exports.profileRepository = {
  createProfile,
  getProfileByUserId,
  updateProfile,
  updateProfileImage,
  deleteProfile,
  getAllProfiles,
};
