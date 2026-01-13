# 🔒 Configuración de Seguridad - CalendarioRestrictivo

## Mejoras de Seguridad Implementadas

### ✅ **Validación de Entrada**

- Validación con Joi para todos los endpoints de autenticación
- Esquemas de validación para login y registro
- Validación de contraseñas con requisitos de seguridad
- Sanitización de datos de entrada

### ✅ **Autenticación y Autorización**

- JWT con configuración segura
- Middleware de autenticación
- Rate limiting para endpoints de autenticación
- Verificación de tokens en tiempo real

### ✅ **Manejo de Errores**

- Clase personalizada AppError
- Middleware global de manejo de errores
- Logs seguros (sin información sensible)
- Respuestas de error consistentes

### ✅ **Configuración de Seguridad**

- Headers de seguridad con Helmet
- Rate limiting general y específico
- CORS configurado correctamente
- Variables de entorno seguras

## 🚀 Configuración Inicial

### 1. Variables de Entorno

Copia el archivo `env.example` a `.env` y configura:

```bash
cp env.example .env
```

Configura las siguientes variables en tu archivo `.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=tu_usuario
DB_PASSWORD=tu_password_seguro
DB_NAME=calendario_db

# JWT Configuration (IMPORTANTE: Cambiar en producción)
JWT_SECRET=tu_super_secreto_jwt_muy_largo_y_complejo
JWT_EXPIRES_IN=1h

# Server Configuration
PORT=7000
NODE_ENV=development

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
FRONTEND_URL=http://localhost:4200
```

### 2. Instalación de Dependencias

```bash
npm install
```

### 3. Ejecutar el Servidor

```bash
npm run dev
```

## 🔧 Endpoints de Seguridad

### Autenticación

- `POST /api/auth/login` - Inicio de sesión (con rate limiting)
- `POST /api/auth/register` - Registro de usuario (con rate limiting)
- `GET /api/auth/verify` - Verificar token (requiere autenticación)

### Health Check

- `GET /health` - Verificar estado del servidor

## 🛡️ Características de Seguridad

### Rate Limiting

- **Autenticación**: 5 intentos por 15 minutos
- **General**: 100 requests por 15 minutos

### Validación de Contraseñas

- Mínimo 6 caracteres
- Debe contener al menos:
  - Una letra minúscula
  - Una letra mayúscula
  - Un número

### Headers de Seguridad

- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Y más...

## ⚠️ Importante para Producción

1. **Cambiar JWT_SECRET**: Usa un secreto fuerte y único
2. **Configurar HTTPS**: Siempre usar HTTPS en producción
3. **Variables de entorno**: No hardcodear secretos
4. **Logs**: Configurar logging apropiado
5. **Base de datos**: Usar conexiones SSL en producción

## 🐛 Debugging

Para activar logs de debug:

```bash
DEBUG=app:* npm run dev
```

## 📝 Notas Adicionales

- Los tokens JWT incluyen información del usuario
- Las contraseñas se hashean con bcrypt
- Los errores no exponen información sensible en producción
- Se incluye timestamp en todas las respuestas
