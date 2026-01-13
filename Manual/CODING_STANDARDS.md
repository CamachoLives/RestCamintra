# 📋 Estándares de Código - CalendarioRestrictivo

## 🎯 **Objetivo**

Mantener consistencia, legibilidad y mantenibilidad del código en todo el proyecto.

## 📝 **Convenciones de Naming**

### **Archivos y Directorios**

- **Archivos**: `camelCase.js` (ej: `userService.js`, `authController.js`)
- **Directorios**: `camelCase` (ej: `userManagement/`, `authServices/`)
- **Constantes**: `UPPER_SNAKE_CASE` (ej: `MAX_RETRY_ATTEMPTS`)

### **Variables y Funciones**

- **Variables**: `camelCase` (ej: `userName`, `isAuthenticated`)
- **Funciones**: `camelCase` (ej: `getUserById`, `validateEmail`)
- **Constantes**: `UPPER_SNAKE_CASE` (ej: `API_BASE_URL`)
- **Clases**: `PascalCase` (ej: `UserService`, `AuthController`)

### **Base de Datos**

- **Colecciones**: `lowercase` (ej: `users`, `activities`)
- **Campos**: `snake_case` (ej: `created_at`, `user_id`)
- **Índices**: `idx_fieldname` (ej: `idx_email`, `idx_created_at`)

## 🏗️ **Estructura de Archivos**

### **Controladores**

```javascript
// Estructura estándar
const debug = require('debug')('app:controller-name');
const { serviceName } = require('./services');
const { response } = require('../common/response');
const { createError } = require('../middleware/errorHandler');

module.exports.controllerName = {
  methodName: async (req, res, next) => {
    try {
      // Validación de entrada
      // Lógica de negocio
      // Respuesta exitosa
    } catch (error) {
      next(error);
    }
  },
};
```
##
### **Servicios**

```javascript
// Estructura estándar
const { repositoryName } = require('./repository');
const { createError } = require('../middleware/errorHandler');
const debug = require('debug')('app:service-name');

const methodName = async params => {
  try {
    // Validación de parámetros
    // Lógica de negocio
    // Retorno de datos
  } catch (error) {
    // Manejo de errores
  }
};

module.exports.serviceName = {
  methodName,
};
```

## 🔧 **Patrones de Código**

### **Manejo de Errores**

```javascript
// ✅ Correcto
try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  if (error.isOperational) {
    throw error;
  }
  throw createError('Mensaje de error descriptivo', 500);
}

// ❌ Incorrecto
try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  console.log(error);
  throw error;
}
```

### **Validación de Entrada**

```javascript
// ✅ Correcto
if (!id) {
  throw createError('ID requerido', 400);
}

if (!ObjectId.isValid(id)) {
  throw createError('ID inválido', 400);
}

// ❌ Incorrecto
if (!id) {
  return res.status(400).json({ error: 'ID required' });
}
```

### **Respuestas de API**

```javascript
// ✅ Correcto
response.success(res, 'Operación exitosa', 200, data);

// ❌ Incorrecto
res.status(200).json({ message: 'Success', data });
```

## 📊 **Logging**

### **Niveles de Debug**

- `app:main` - Aplicación principal
- `app:controller-name` - Controladores específicos
- `app:service-name` - Servicios específicos
- `app:database` - Operaciones de base de datos
- `app:auth` - Autenticación y autorización

### **Formato de Logs**

```javascript
// ✅ Correcto
debug('Operation completed successfully:', { userId, operation });
debug('Error occurred:', { error: error.message, context });

// ❌ Incorrecto
console.log('Success');
console.error(error);
```

## 🛡️ **Seguridad**

### **Información Sensible**

```javascript
// ✅ Correcto - No logear información sensible
const { password_hash, ...userWithoutPassword } = user;
debug('User retrieved:', { id: user.id, email: user.email });

// ❌ Incorrecto
debug('User data:', user); // Incluye password_hash
```

### **Validación de Entrada**

```javascript
// ✅ Correcto
const { email, password } = req.body;
if (!email || !password) {
  throw createError('Email y contraseña requeridos', 400);
}

// ❌ Incorrecto
const { email, password } = req.body;
// Sin validación
```

## 📁 **Organización de Código**

### **Imports**

```javascript
// 1. Node modules
const express = require('express');
const debug = require('debug');

// 2. Internal modules (relativos)
const { serviceName } = require('./services');
const { response } = require('../common/response');

// 3. Constants
const { HTTP_STATUS } = require('../constants');
```

### **Exports**

```javascript
// ✅ Correcto
module.exports.serviceName = {
  method1,
  method2,
};

// ❌ Incorrecto
module.exports = {
  method1,
  method2,
};
```

## 🧪 **Testing**

### **Naming de Tests**

```javascript
// Archivo: userService.test.js
describe('UserService', () => {
  describe('getUserById', () => {
    it('should return user when valid ID is provided', () => {});
    it('should throw error when invalid ID is provided', () => {});
    it('should return null when user not found', () => {});
  });
});
```

## 📋 **Checklist de Code Review**

### **Antes de Commit**

- [ ] Código formateado con Prettier
- [ ] Sin errores de ESLint
- [ ] Naming conventions aplicadas
- [ ] Manejo de errores implementado
- [ ] Logs apropiados añadidos
- [ ] Validación de entrada presente
- [ ] Información sensible no expuesta

### **Estructura**

- [ ] Imports organizados correctamente
- [ ] Exports consistentes
- [ ] Funciones con responsabilidad única
- [ ] Código duplicado eliminado

### **Seguridad**

- [ ] Validación de entrada
- [ ] Sanitización de datos
- [ ] Manejo seguro de errores
- [ ] No exposición de información sensible

## 🚀 **Scripts Disponibles**

```bash
# Formatear código
npm run format

# Verificar formato
npm run format:check

# Linting
npm run lint

# Linting con auto-fix
npm run lint:fix

# Desarrollo
npm run dev
```

## 📚 **Recursos Adicionales**

- [Prettier Configuration](.prettierrc)
- [ESLint Configuration](.eslintrc.js)
- [Security Setup](SECURITY_SETUP.md)
- [API Documentation](API_DOCS.md)
