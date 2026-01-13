const axios = require('axios');

const API_BASE_URL = 'http://localhost:7000/api';

// Función para hacer login y obtener token
async function login() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123',
    });

    console.log('✅ Login exitoso');
    return response.data.data.token;
  } catch (error) {
    console.error('❌ Error en login:', error.response?.data || error.message);
    return null;
  }
}

// Función para probar crear perfil
async function testCreateProfile(token) {
  try {
    const profileData = {
      userId: '1',
      biografia:
        'Desarrollador full-stack con 5 años de experiencia en Node.js y Angular',
      area: 'Desarrollo de Software',
      telefono: '+1 (555) 123-4567',
      ubicacion: 'Madrid, España',
      sitio_web: 'https://mi-sitio.com',
      redes_sociales: {
        linkedin: 'https://linkedin.com/in/mi-perfil',
        github: 'https://github.com/mi-usuario',
        twitter: 'https://twitter.com/mi-usuario',
      },
    };

    const response = await axios.post(`${API_BASE_URL}/profile`, profileData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('✅ Perfil creado exitosamente');
    console.log('📋 Datos del perfil:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error(
      '❌ Error creando perfil:',
      error.response?.data || error.message
    );
    return null;
  }
}

// Función para probar obtener mi perfil
async function testGetMyProfile(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/profile/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('✅ Perfil obtenido exitosamente');
    console.log('📋 Mi perfil:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error(
      '❌ Error obteniendo perfil:',
      error.response?.data || error.message
    );
    return null;
  }
}

// Función para probar actualizar perfil
async function testUpdateProfile(token) {
  try {
    const updateData = {
      biografia: 'Desarrollador full-stack senior con 6 años de experiencia',
      area: 'Desarrollo de Software',
      telefono: '+1 (555) 987-6543',
      ubicacion: 'Barcelona, España',
    };

    const response = await axios.put(`${API_BASE_URL}/profile/me`, updateData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('✅ Perfil actualizado exitosamente');
    console.log('📋 Perfil actualizado:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error(
      '❌ Error actualizando perfil:',
      error.response?.data || error.message
    );
    return null;
  }
}

// Función para probar actualizar imagen
async function testUpdateImage(token) {
  try {
    const imageData = {
      imageUrl: 'https://via.placeholder.com/300x300?text=Profile+Image',
    };

    const response = await axios.put(
      `${API_BASE_URL}/profile/me/image`,
      imageData,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log('✅ Imagen actualizada exitosamente');
    console.log('📋 Perfil con nueva imagen:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error(
      '❌ Error actualizando imagen:',
      error.response?.data || error.message
    );
    return null;
  }
}

// Función para probar obtener todos los perfiles
async function testGetAllProfiles(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/profile/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('✅ Perfiles obtenidos exitosamente');
    console.log('📋 Lista de perfiles:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error(
      '❌ Error obteniendo perfiles:',
      error.response?.data || error.message
    );
    return null;
  }
}

// Función para probar búsqueda de perfiles
async function testSearchProfiles(token) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/profile/search?q=desarrollador&area=Desarrollo de Software`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log('✅ Búsqueda exitosa');
    console.log('📋 Resultados de búsqueda:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error(
      '❌ Error en búsqueda:',
      error.response?.data || error.message
    );
    return null;
  }
}

// Función principal de pruebas
async function runTests() {
  console.log('🚀 Iniciando pruebas del módulo de perfil...\n');

  // 1. Login
  console.log('1️⃣ Probando login...');
  const token = await login();
  if (!token) {
    console.log('❌ No se pudo obtener token. Terminando pruebas.');
    return;
  }

  console.log('\n2️⃣ Probando crear perfil...');
  await testCreateProfile(token);

  console.log('\n3️⃣ Probando obtener mi perfil...');
  await testGetMyProfile(token);

  console.log('\n4️⃣ Probando actualizar perfil...');
  await testUpdateProfile(token);

  console.log('\n5️⃣ Probando actualizar imagen...');
  await testUpdateImage(token);

  console.log('\n6️⃣ Probando obtener todos los perfiles...');
  await testGetAllProfiles(token);

  console.log('\n7️⃣ Probando búsqueda de perfiles...');
  await testSearchProfiles(token);

  console.log('\n✅ Pruebas completadas!');
}

// Ejecutar pruebas
runTests().catch(console.error);
