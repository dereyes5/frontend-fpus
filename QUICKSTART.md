# 🚀 Guía de Inicio Rápido - Sistema FPUS

## ✅ Lo que se ha completado

### 1. Infraestructura Base
- ✅ Configuración completa de Vite + React + TypeScript
- ✅ Tailwind CSS configurado
- ✅ Shadcn/ui components instalados
- ✅ Sistema de rutas con React Router
- ✅ Axios configurado con interceptores

### 2. Sistema de Autenticación
- ✅ Context API para manejo de estado global
- ✅ Login con JWT
- ✅ Protección de rutas
- ✅ Interceptores para tokens expirados
- ✅ Cambio de contraseña

### 3. Sistema de Permisos
- ✅ Permisos dinámicos por rol
- ✅ Protección granular (ver/editar) por recurso
- ✅ HOCs ProtectedRoute y ProtectedAction
- ✅ Menú dinámico según permisos

### 4. Módulos Implementados
- ✅ Dashboard con estadísticas en tiempo real
- ✅ Benefactores (CRUD completo)
- ✅ Aprobaciones (aprobar/rechazar registros)
- ✅ Cartera y Cobros (estados de pago, estadísticas)
- ✅ Usuarios (crear, asignar roles)
- ✅ Roles y Permisos (CRUD, configuración de permisos)
- ✅ Configuración (perfil, cambio de contraseña)

### 5. Servicios API
- ✅ authService - Autenticación
- ✅ permisosService - Gestión de permisos
- ✅ benefactoresService - Benefactores
- ✅ aprobacionesService - Aprobaciones
- ✅ cobrosService - Cobros y cartera
- ✅ rolesService - Roles

## 📦 Instalación

```bash
cd frontend
npm install
```

## 🎮 Comandos Disponibles

```bash
# Iniciar servidor de desarrollo (puerto 5173 por defecto)
npm run dev

# Compilar para producción
npm run build

# Previsualizar build de producción
npm run preview

# Ejecutar linter
npm run lint
```

## 🔧 Configuración de la API

El frontend está configurado para conectarse a:
```
http://154.12.234.100:3000/api
```

Si necesitas cambiar la URL, edita: `frontend/services/api.ts`

```typescript
const api = axios.create({
  baseURL: 'TU_NUEVA_URL_AQUI',
  // ...
});
```

## 🔐 Credenciales de Prueba

El sistema requiere credenciales válidas del backend. Ejemplo:

```
Usuario: PRODRIGUEZ
Contraseña: (proporcionada por el backend)
```

## 📱 Acceso al Sistema

1. Iniciar el frontend:
```bash
cd frontend
npm run dev
```

2. Abrir en navegador: `http://localhost:5173`

3. Iniciar sesión con credenciales válidas

4. El sistema cargará automáticamente:
   - Permisos del usuario
   - Menú dinámico
   - Módulos permitidos

## 🎯 Flujo de Trabajo

### Para un Usuario Ejecutivo
1. Login → Dashboard
2. Ver estadísticas generales
3. Acceder a Benefactores
4. Crear/Editar benefactores
5. Gestionar aprobaciones

### Para un Usuario Financiero
1. Login → Dashboard
2. Ver estadísticas de cobros
3. Acceder a Cartera
4. Ver estado de pagos
5. Revisar morosos y parciales

### Para un Administrador
1. Login → Dashboard
2. Acceso completo a todos los módulos
3. Gestionar usuarios y roles
4. Configurar permisos por rol
5. Ver todas las estadísticas

## 📊 Estructura de Datos

### Benefactor
```typescript
{
  tipo_benefactor: "TITULAR" | "DEPENDIENTE",
  nombre_completo: string,
  cedula: string,
  email?: string,
  telefono?: string,
  // ... más campos
}
```

### Estado de Pago
```typescript
{
  id_benefactor: number,
  nombre_completo: string,
  estado_pago: "PAGADO" | "PAGO_PARCIAL" | "NO_PAGADO",
  monto_a_pagar: string,
  monto_pagado: string,
  // ...
}
```

## 🎨 Temas y Colores

### Colores Principales
- **Primary**: #4064E3 (Azul)
- **Success**: #0F8F5B (Verde)
- **Warning**: #FFA500 (Naranja)
- **Danger**: #DC2626 (Rojo)
- **Background**: #F4F6F8 (Gris claro)

### Iconos
Utiliza Lucide React para todos los iconos:
```tsx
import { Users, Wallet, CheckCircle } from "lucide-react";
```

## 🔍 Debugging

### Ver permisos del usuario actual
```javascript
// En la consola del navegador
JSON.parse(localStorage.getItem('fpus_permisos'))
```

### Ver usuario actual
```javascript
JSON.parse(localStorage.getItem('fpus_user'))
```

### Ver token
```javascript
localStorage.getItem('fpus_token')
```

### Limpiar sesión
```javascript
localStorage.clear()
```

## 🐛 Problemas Comunes

### Error: "Network Error"
- ✅ Verificar que el backend esté corriendo
- ✅ Verificar la URL de la API en `services/api.ts`
- ✅ Verificar CORS en el backend

### Error: 401 Unauthorized
- ✅ Token expirado - hacer login nuevamente
- ✅ Verificar credenciales
- ✅ Backend caído

### Error: 403 Forbidden
- ✅ Usuario sin permisos para esa acción
- ✅ Verificar roles asignados
- ✅ Verificar permisos del rol en el backend

### Módulo no aparece en el menú
- ✅ Usuario no tiene permiso "ver" para ese recurso
- ✅ Verificar permisos con `permisosService.getMisPermisos()`

## 📚 Recursos Adicionales

### Documentación de Tecnologías
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [React Router](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Axios](https://axios-http.com/)

### Componentes UI
Todos los componentes UI están en `components/ui/` y están basados en Shadcn/ui.

## 🚀 Próximos Pasos

1. **Instalar dependencias**: `npm install`
2. **Iniciar desarrollo**: `npm run dev`
3. **Probar funcionalidades**:
   - Login con diferentes roles
   - Crear benefactores
   - Aprobar registros
   - Ver estadísticas de cartera
   - Gestionar usuarios y roles

## 💡 Tips de Desarrollo

### Agregar un nuevo recurso con permisos
1. Crear el servicio en `services/`
2. Agregar tipos en `types/index.ts`
3. Crear componente en `components/`
4. Agregar ruta en `utils/routes.ts` con `<ProtectedRoute>`
5. Agregar al menú en `Layout.tsx`

### Proteger una acción
```tsx
<ProtectedAction recurso="benefactores" accion="editar">
  <Button>Crear Benefactor</Button>
</ProtectedAction>
```

### Notificaciones
```tsx
import { toast } from "sonner";

toast.success("Operación exitosa");
toast.error("Error al procesar");
toast.info("Información importante");
```

## 📝 Notas Importantes

- El sistema usa **localStorage** para guardar token y permisos
- Los permisos se cargan al hacer login
- El token se envía automáticamente en todas las peticiones
- Las rutas protegidas redirigen a login si no hay token
- El menú se genera dinámicamente según permisos

## ✅ Checklist de Verificación

- [ ] Backend corriendo en http://154.12.234.100:3000
- [ ] Frontend instalado: `npm install`
- [ ] Frontend corriendo: `npm run dev`
- [ ] Puedes hacer login
- [ ] Ves el dashboard
- [ ] Los módulos aparecen según tus permisos
- [ ] Puedes crear/editar según permisos

---

**¡El sistema está listo para usar!** 🎉

Para cualquier consulta, revisa la documentación completa en `README_FRONTEND.md`
