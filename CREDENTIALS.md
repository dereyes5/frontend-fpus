# 🔐 Credenciales y Acceso - Sistema FPUS

## 🎯 Credenciales de Acceso

### Usuario Ejemplo del Backend
Según el backend configurado, existe al menos un usuario:

```
Usuario: PRODRIGUEZ
Contraseña: (configurada en backend/scripts/init-passwords.js)
Rol: EJECUTIVO
```

**IMPORTANTE**: Consulta con el administrador del backend para obtener las credenciales actualizadas.

## 🚀 Cómo Iniciar el Sistema Completo

### 1. Backend (Puerto 3000)

```bash
cd backend
npm install
node index.js
```

El backend debe estar corriendo en: `http://154.12.234.100:3000` o `http://localhost:3000`

### 2. Frontend (Puerto 5173)

```bash
cd frontend
npm install
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

## 📋 Pasos para Primer Acceso

1. **Asegúrate que el backend esté corriendo**
   - Abre una terminal
   - Navega a `backend/`
   - Ejecuta `node index.js`
   - Deberías ver: "Servidor corriendo en puerto 3000"

2. **Inicia el frontend**
   - Abre otra terminal
   - Navega a `frontend/`
   - Ejecuta `npm run dev`
   - Abre navegador en `http://localhost:5173`

3. **Login**
   - Ingresa usuario: `PRODRIGUEZ` (o el que tengas configurado)
   - Ingresa contraseña
   - Click en "Iniciar sesión"

4. **Sistema cargará automáticamente**
   - Permisos del usuario
   - Menú dinámico
   - Dashboard con estadísticas

## 🎭 Roles Predefinidos

El sistema soporta los siguientes roles (definidos en el backend):

### EJECUTIVO
- ✅ Ver y editar Benefactores
- ✅ Ver y editar Aprobaciones
- ✅ Ver Cobros (solo lectura)
- ❌ Gestión de usuarios
- ❌ Gestión de roles

### ADMINISTRADOR (si existe)
- ✅ Acceso completo a todos los módulos
- ✅ Gestión de usuarios
- ✅ Gestión de roles y permisos
- ✅ Todas las funcionalidades

### CONSULTA (si existe)
- ✅ Ver Benefactores (solo lectura)
- ✅ Ver Cobros (solo lectura)
- ❌ No puede editar
- ❌ No puede aprobar

## 🔧 Configuración de Nuevos Usuarios

### Opción 1: Desde el Sistema (si tienes permisos)
1. Login como usuario con permisos de "usuarios"
2. Ir a módulo "Usuarios"
3. Click en "Nuevo usuario"
4. Ingresar nombre de usuario y contraseña
5. Usar "Asignar rol" para asignar rol al usuario

### Opción 2: Desde el Backend
Usar el endpoint público (solo la primera vez):

```bash
curl -X POST http://localhost:3000/api/auth/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_usuario": "NUEVO_USUARIO",
    "password": "password123"
  }'
```

Luego asignar rol:
```bash
curl -X POST http://localhost:3000/api/auth/usuarios/asignar-rol \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{
    "id_usuario": 5,
    "id_rol": 1
  }'
```

## 📊 Gestión de Permisos

### Ver Permisos de un Usuario
1. Login con el usuario
2. Ir a Configuración → Mi Perfil
3. Ver roles asignados

O desde la consola del navegador:
```javascript
JSON.parse(localStorage.getItem('fpus_permisos'))
```

### Modificar Permisos de un Rol
1. Login como administrador
2. Ir a módulo "Roles"
3. Click en "Permisos" del rol deseado
4. Activar/desactivar checkboxes de "Ver" y "Editar"
5. Guardar cambios

## 🔄 Reiniciar Contraseñas (Administrador Backend)

Si necesitas resetear contraseñas, usa el script del backend:

```bash
cd backend
node scripts/init-passwords.js
```

Este script actualiza las contraseñas de los usuarios predefinidos.

## 🆘 Problemas de Acceso

### "Usuario o contraseña incorrectos"
- ✅ Verificar mayúsculas/minúsculas en el usuario
- ✅ Verificar que el backend esté corriendo
- ✅ Revisar logs del backend para ver el error
- ✅ Intentar crear un nuevo usuario

### "No puedo ver ningún módulo"
- ✅ Usuario no tiene roles asignados
- ✅ Asignar un rol al usuario
- ✅ Verificar que el rol tenga permisos configurados

### "Token expirado"
- ✅ Hacer logout
- ✅ Hacer login nuevamente
- ✅ El token se renueva automáticamente

## 📝 Crear Roles Personalizados

1. Login como administrador
2. Ir a módulo "Roles"
3. Click en "Nuevo rol"
4. Ingresar nombre (ej: "SUPERVISOR")
5. Guardar
6. Click en "Permisos" del nuevo rol
7. Configurar permisos:
   - Benefactores: Ver ✅, Editar ✅
   - Aprobaciones: Ver ✅, Editar ❌
   - Cobros: Ver ✅, Editar ❌
   - Usuarios: Ver ❌, Editar ❌
   - Roles: Ver ❌, Editar ❌
8. Guardar permisos

## 🎯 Permisos por Módulo

| Módulo | Ver | Editar |
|--------|-----|--------|
| **Benefactores** | Ver lista, detalles | Crear, editar, eliminar, asignar dependientes |
| **Aprobaciones** | Ver pendientes | Aprobar, rechazar |
| **Cobros** | Ver estadísticas, estados | Registrar cobros |
| **Usuarios** | Ver usuarios | Crear usuarios, asignar roles |
| **Roles** | Ver roles | Crear, editar, eliminar roles, configurar permisos |

## 💡 Buenas Prácticas

1. **No compartir credenciales**: Cada usuario debe tener su propia cuenta
2. **Principio de mínimo privilegio**: Asignar solo los permisos necesarios
3. **Cambiar contraseñas regularmente**: Usar función en Configuración
4. **Revisar permisos periódicamente**: Verificar que cada rol tenga los permisos correctos
5. **Hacer logout al terminar**: Especialmente en computadoras compartidas

## 🔍 Verificar Configuración

### Backend
```bash
curl http://localhost:3000/api/roles
```
Debería retornar lista de roles.

### Frontend + Backend
1. Abrir http://localhost:5173
2. Debería ver página de login
3. Si ves errores de red, verificar que backend esté corriendo

### Token Válido
Después de login, en consola del navegador:
```javascript
localStorage.getItem('fpus_token')
// Debería mostrar un string JWT largo
```

## 📞 Soporte

Si tienes problemas:
1. Revisar logs del backend
2. Revisar consola del navegador (F12)
3. Verificar Network tab para ver requests/responses
4. Revisar que todos los servicios estén corriendo
5. Consultar README_FRONTEND.md para más detalles

---

**Sistema listo para producción** ✅

El frontend implementa todas las funcionalidades especificadas en FRONTEND_PROMPT.md
