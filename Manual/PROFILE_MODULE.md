# 👤 Módulo de Perfil de Usuario - CalendarioRestrictivo

## 📋 **Descripción**

Módulo completo para la gestión de perfiles de usuario que incluye biografía, área de trabajo, información de contacto, redes sociales y más.

## 🚀 **Características Implementadas**

### **Backend (Node.js + Express + PostgreSQL)**

- ✅ **CRUD completo** para perfiles de usuario
- ✅ **Validación robusta** con Joi
- ✅ **Autenticación JWT** para rutas protegidas
- ✅ **Manejo de errores** consistente
- ✅ **Base de datos optimizada** con índices
- ✅ **Búsqueda y filtrado** por área
- ✅ **Paginación** para listados
- ✅ **Actualización de imagen** de perfil

### **Frontend (Angular 19)**

- ✅ **Interfaz moderna** con Bootstrap 5
- ✅ **Formularios reactivos** con validación
- ✅ **Modo edición** intuitivo
- ✅ **Carga de imágenes** de perfil
- ✅ **Redes sociales** integradas
- ✅ **Responsive design**
- ✅ **Manejo de errores** en tiempo real

## 🗄️ **Estructura de Base de Datos**

### **Tabla: user_profiles**

```sql
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    biografia TEXT DEFAULT '',
    area VARCHAR(100) NOT NULL DEFAULT 'Sin especificar',
    telefono VARCHAR(20) DEFAULT '',
    ubicacion VARCHAR(100) DEFAULT '',
    sitio_web VARCHAR(255) DEFAULT '',
    imagen_url VARCHAR(500) DEFAULT '',
    redes_sociales JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔗 **Endpoints de la API**

### **Rutas Públicas**

- `GET /api/profile/search` - Búsqueda de perfiles
- `GET /api/profile/all` - Listar todos los perfiles

### **Rutas Protegidas (Requieren JWT)**

- `POST /api/profile` - Crear perfil
- `GET /api/profile/me` - Obtener mi perfil
- `GET /api/profile/:userId` - Obtener perfil específico
- `PUT /api/profile/me` - Actualizar mi perfil
- `PUT /api/profile/:userId` - Actualizar perfil específico
- `PUT /api/profile/:userId/image` - Actualizar imagen de perfil
- `DELETE /api/profile/me` - Eliminar mi perfil
- `DELETE /api/profile/:userId` - Eliminar perfil específico

## 📝 **Esquemas de Validación**

### **Crear Perfil**

```javascript
{
  userId: string (requerido),
  biografia: string (máx 500 caracteres),
  area: string (requerido, máx 100 caracteres),
  telefono: string (formato válido, máx 20 caracteres),
  ubicacion: string (máx 100 caracteres),
  sitio_web: string (URL válida),
  redes_sociales: {
    linkedin: string (URL válida),
    twitter: string (URL válida),
    github: string (URL válida)
  }
}
```

### **Actualizar Perfil**

```javascript
{
  biografia: string (máx 500 caracteres),
  area: string (máx 100 caracteres),
  telefono: string (formato válido, máx 20 caracteres),
  ubicacion: string (máx 100 caracteres),
  sitio_web: string (URL válida),
  redes_sociales: {
    linkedin: string (URL válida),
    twitter: string (URL válida),
    github: string (URL válida)
  }
}
```

## 🎨 **Interfaz de Usuario**

### **Vista de Perfil**

- **Header con imagen**: Foto de perfil, nombre, email y área
- **Información personal**: Biografía, teléfono, ubicación, sitio web
- **Redes sociales**: Enlaces a LinkedIn, Twitter, GitHub
- **Botón de edición**: Acceso rápido al modo edición

### **Modo Edición**

- **Formulario completo**: Todos los campos editables
- **Validación en tiempo real**: Feedback inmediato
- **Áreas predefinidas**: Lista desplegable con opciones comunes
- **Contador de caracteres**: Para biografía (máx 500)
- **Botones de acción**: Guardar y cancelar

### **Características UX**

- **Responsive**: Adaptable a móviles y tablets
- **Animaciones suaves**: Transiciones fluidas
- **Mensajes de estado**: Éxito y error claros
- **Loading states**: Indicadores de carga
- **Validación visual**: Campos requeridos marcados

## 🔧 **Configuración**

### **Backend**

1. **Ejecutar migración**:

   ```sql
   -- Ejecutar el archivo: database/migrations/001_create_user_profiles_table.sql
   ```

2. **Variables de entorno**:

   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=tu_usuario
   DB_PASSWORD=tu_password
   DB_NAME=calendario_db
   ```

3. **Instalar dependencias**:

   ```bash
   npm install
   ```

4. **Ejecutar servidor**:
   ```bash
   npm run dev
   ```

### **Frontend**

1. **Instalar dependencias**:

   ```bash
   npm install
   ```

2. **Ejecutar aplicación**:
   ```bash
   npm start
   ```

## 📊 **Áreas Predefinidas**

- Desarrollo de Software
- Diseño UX/UI
- Marketing Digital
- Ventas
- Recursos Humanos
- Finanzas
- Operaciones
- Soporte Técnico
- Gestión de Proyectos
- Investigación y Desarrollo
- Otro

## 🔒 **Seguridad**

### **Validaciones**

- **Sanitización de entrada**: Todos los datos se limpian
- **Validación de URLs**: Formato correcto para enlaces
- **Límites de caracteres**: Prevención de ataques de longitud
- **Autenticación JWT**: Verificación de tokens
- **Autorización**: Solo el propietario puede editar su perfil

### **Base de Datos**

- **Foreign Key**: Relación con tabla usuarios
- **Índices optimizados**: Búsquedas rápidas
- **Triggers**: Actualización automática de timestamps
- **Cascade Delete**: Eliminación en cascada

## 🚀 **Próximas Mejoras**

### **Funcionalidades Adicionales**

- [ ] **Subida de archivos**: Imágenes locales
- [ ] **Notificaciones**: Cambios en perfil
- [ ] **Historial**: Versiones anteriores del perfil
- [ ] **Exportar perfil**: PDF o JSON
- [ ] **Temas**: Personalización visual
- [ ] **Idiomas**: Soporte multiidioma

### **Integraciones**

- [ ] **LinkedIn API**: Sincronización automática
- [ ] **Gravatar**: Imágenes automáticas
- [ ] **Google Maps**: Ubicación interactiva
- [ ] **QR Code**: Perfil compartible

## 📚 **Uso del Módulo**

### **Crear Perfil**

```typescript
const profileData = {
  userId: '123',
  biografia: 'Desarrollador full-stack con 5 años de experiencia',
  area: 'Desarrollo de Software',
  telefono: '+1 (555) 123-4567',
  ubicacion: 'Madrid, España',
  sitio_web: 'https://mi-sitio.com',
  redes_sociales: {
    linkedin: 'https://linkedin.com/in/mi-perfil',
    github: 'https://github.com/mi-usuario',
  },
};

profileService.createProfile(profileData).subscribe(response => {
  console.log('Perfil creado:', response.data);
});
```

### **Actualizar Perfil**

```typescript
const updateData = {
  biografia: 'Nueva biografía actualizada',
  area: 'Diseño UX/UI',
  telefono: '+1 (555) 987-6543',
};

profileService.updateProfile(updateData).subscribe(response => {
  console.log('Perfil actualizado:', response.data);
});
```

### **Buscar Perfiles**

```typescript
profileService
  .searchProfiles({
    q: 'desarrollador',
    area: 'Desarrollo de Software',
    page: 1,
    limit: 10,
  })
  .subscribe(response => {
    console.log('Resultados:', response.data.profiles);
  });
```

## 🐛 **Solución de Problemas**

### **Errores Comunes**

1. **"Perfil no encontrado"**: Verificar que el usuario tenga perfil creado
2. **"No tienes permisos"**: Verificar token JWT válido
3. **"Datos inválidos"**: Revisar formato de URLs y teléfonos
4. **"Error de conexión"**: Verificar configuración de base de datos

### **Logs de Debug**

```bash
# Backend
DEBUG=app:profile-* npm run dev

# Frontend
# Revisar consola del navegador para errores
```

## 📞 **Soporte**

Para problemas o preguntas sobre el módulo de perfil, revisar:

- [Documentación de API](API_DOCS.md)
- [Estándares de Código](CODING_STANDARDS.md)
- [Configuración de Seguridad](SECURITY_SETUP.md)

