# 📋 Constantes globales - Intra

## 🎯 **Objetivo**

**Son valores reutilizables que ayudan a mantener el código limpio, consistente y fácil de mantener. Se agrupan por funcionalidad**

🔧 **Detalle por sección**
# 1. HTTP_STATUS

**Define los códigos de estado HTTP que se usan en las respuestas del servidor.**
**Ejemplo: 200 OK, 404 Not Found, 500 Internal Server Error.**

# 2. ERROR_MESSAGES

**Mensajes estándar para errores comunes en la aplicación.**
**Útil para centralizar los textos que se devuelven al cliente en caso de fallos.**

# 3. SUCCESS_MESSAGES

**Mensajes que indican que una operación fue exitosa.**
**Se usan en respuestas positivas del servidor.**

# 4. COLLECTIONS

**Nombres de las colecciones de base de datos, probablemente MongoDB.**
**Evita errores por escribir mal los nombres en distintas partes del código.**

# 5. PAGINATION

**Valores por defecto para paginación de resultados.**
**Muy útil en APIs REST para limitar la cantidad de datos por página.**

# 6. VALIDATION

**Reglas de validación para campos como contraseñas, nombres y correos.**
**Se pueden usar en middlewares o servicios de validación.**

# 7. RATE_LIMITS

**Límites de uso para proteger la API contra abusos (rate limiting).**
**Por ejemplo, máximo 5 intentos de login cada 15 minutos.**