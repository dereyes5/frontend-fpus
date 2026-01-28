# Frontend - Sistema de Gestión de Benefactores

Frontend desarrollado en React con TypeScript para el sistema de gestión de benefactores, con autenticación JWT, sistema de roles y permisos dinámicos.

## 🚀 Características Principales

- ✅ Autenticación JWT con protección de rutas
- ✅ Sistema de permisos dinámico basado en roles
- ✅ Gestión completa de usuarios y asignación de roles
- ✅ **Sistema de sucursales con asignación de usuarios**
- ✅ Gestión de benefactores (titulares y dependientes)
- ✅ Sistema de aprobaciones de registros
- ✅ Módulo de cobros y pagos con estadísticas
- ✅ Dashboard con métricas y reportes
- ✅ Interfaz responsive con Tailwind CSS
- ✅ Componentes UI con shadcn/ui

## 📋 Requisitos Previos

- Node.js (v16 o superior)
- npm o yarn
- Backend API corriendo (ver `backend/README.md`)

## 🔧 Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar la URL del backend en `src/services/api.ts`:
```typescript
const api = axios.create({
  baseURL: 'http://tu-servidor:3000/api',
  // ...
});
```

3. Ejecutar en modo desarrollo:
```bash
npm run dev
```

4. Compilar para producción:
```bash
npm run build
```

## 📚 Estructura del Proyecto

```
frontend/
├── components/
│   ├── Aprobaciones.tsx        # Gestión de aprobaciones
│   ├── Benefactores.tsx        # CRUD de benefactores
│   ├── Cartera.tsx             # Módulo de cobros y pagos
│   ├── Dashboard.tsx           # Panel principal con métricas
│   ├── Layout.tsx              # Layout principal con navegación
│   ├── Login.tsx               # Página de autenticación
│   ├── ProtectedAction.tsx     # HOC para proteger acciones
│   ├── ProtectedRoute.tsx      # HOC para proteger rutas
│   ├── Roles.tsx               # Gestión de roles
│   ├── Usuarios.tsx            # Gestión de usuarios y sucursales
│   └── ui/                     # Componentes UI reutilizables
├── contexts/
│   └── AuthContext.tsx         # Context de autenticación y permisos
├── services/
│   ├── api.ts                  # Configuración de Axios
│   ├── auth.service.ts         # Servicios de autenticación
│   ├── benefactores.service.ts # Servicios de benefactores
│   ├── cobros.service.ts       # Servicios de cobros
│   ├── permisos.service.ts     # Servicios de permisos
│   ├── roles.service.ts        # Servicios de roles
│   └── sucursales.service.ts   # Servicios de sucursales
├── types/
│   └── index.ts                # TypeScript interfaces
├── utils/
│   ├── permissions.ts          # Utilidades de permisos
│   └── routes.tsx              # Configuración de rutas
├── App.tsx                     # Componente raíz
└── main.tsx                    # Punto de entrada
```

## 🔐 Sistema de Autenticación

### Login
El usuario ingresa sus credenciales y el sistema:
1. Valida contra el backend (`POST /api/auth/login`)
2. Guarda el token JWT en localStorage
3. Obtiene los permisos del usuario (`GET /api/permisos/mis-permisos`)
4. Guarda los permisos en el Context
5. Redirige al Dashboard

### Protección de Rutas
Componente `<ProtectedRoute>` que:
- Verifica si el usuario está autenticado
- Valida si tiene permiso `puede_ver` para el recurso
- Redirige al login si no está autenticado
- Muestra mensaje de "sin permisos" si no tiene acceso

### Protección de Acciones
Componente `<ProtectedAction>` que:
- Valida si el usuario tiene permiso `puede_editar`
- Deshabilita o oculta botones/acciones según permisos

## 📦 Módulos Principales

### 1. Usuarios y Sucursales
**Ruta:** `/usuarios`

Funcionalidades:
- Crear nuevos usuarios
- Asignar roles a usuarios
- **Asignar sucursales a usuarios**
- Ver lista completa de usuarios con sus roles y sucursales
- Selector de sucursal en cada usuario

**Permisos requeridos:**
- `usuarios.ver`: Para ver la página
- `usuarios.editar`: Para crear usuarios y asignar roles/sucursales

### 2. Benefactores
**Ruta:** `/benefactores`

Funcionalidades:
- Listar benefactores con filtros (tipo, estado)
- Crear nuevos benefactores (titular o dependiente)
- **Número de contrato generado automáticamente** por sucursal del agente
- Editar información de benefactores
- Ver detalles completos
- Asignar dependientes a titulares

**Permisos requeridos:**
- `benefactores.ver`: Para ver la página
- `benefactores.editar`: Para crear/editar benefactores

**Nota importante:** El número de contrato se genera automáticamente en el backend usando las iniciales de la sucursal del usuario que crea el benefactor (ej: SD001, SD002, GYE001).

### 3. Aprobaciones
**Ruta:** `/aprobaciones`

Funcionalidades:
- Ver lista de registros pendientes de aprobación
- Aprobar o rechazar registros con comentarios
- Ver historial de aprobaciones

**Permisos requeridos:**
- `aprobaciones.ver`: Para ver la página
- `aprobaciones.editar`: Para aprobar/rechazar

### 4. Cobros y Pagos (Cartera)
**Ruta:** `/cartera`

Funcionalidades:
- Dashboard con estadísticas de recaudación
- Lista de benefactores por estado de pago (Pagados, Parciales, Morosos)
- Registro de cobros desde archivo del banco
- Historial de pagos por benefactor

**Permisos requeridos:**
- `cobros.ver`: Para ver la página
- `cobros.editar`: Para registrar cobros

### 5. Roles y Permisos
**Ruta:** `/roles`

Funcionalidades:
- CRUD de roles
- Configuración de permisos por rol
- Matriz de permisos (ver/editar) por recurso

**Permisos requeridos:**
- `roles.ver`: Para ver la página
- `roles.editar`: Para crear/editar roles y permisos

## 🎨 Componentes UI

El proyecto utiliza **shadcn/ui** para componentes reutilizables:

- `Button`: Botones con variantes
- `Input`: Campos de texto
- `Select`: Selectores desplegables
- `Dialog`: Modales
- `Table`: Tablas de datos
- `Card`: Tarjetas de contenido
- `Badge`: Etiquetas
- `Alert`: Notificaciones
- Y más...

Todos los componentes están en `components/ui/` y son personalizables con Tailwind CSS.

## 🔄 Flujo de Trabajo Típico

### Crear un Benefactor

1. Usuario debe estar autenticado y tener una **sucursal asignada**
2. Ir a `/benefactores` → Botón "Crear Benefactor"
3. Llenar formulario (tipo TITULAR o DEPENDIENTE)
4. Al guardar, el backend genera automáticamente el `num_contrato` usando las iniciales de la sucursal del usuario (ej: SD001, SD002)
5. El registro se crea con estado `PENDIENTE`
6. Un usuario con permisos de aprobación debe aprobar el registro

### Asignar Sucursal a Usuario

1. Ir a `/usuarios`
2. En la fila del usuario, clic en botón "Sucursal"
3. Seleccionar sucursal del dropdown
4. Confirmar asignación
5. El usuario ahora puede crear benefactores con los números de contrato de esa sucursal

### Procesar Cobros del Banco

1. Ir a `/cartera`
2. Clic en "Cargar Cobros"
3. Seleccionar archivo de cobros del banco (o ingresar manualmente)
4. El sistema procesa los cobros y actualiza saldos automáticamente
5. Ver estadísticas actualizadas en el dashboard

## 🌐 Configuración de API

El archivo `services/api.ts` configura Axios con:

```typescript
// Interceptor de Request: Agrega token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fpus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de Response: Maneja errores 401 (token expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## 📱 Navegación y Menú

El menú lateral (`Layout.tsx`) muestra opciones según permisos:

- **Dashboard**: Siempre visible
- **Benefactores**: Solo si `benefactores.ver === true`
- **Aprobaciones**: Solo si `aprobaciones.ver === true`
- **Cartera**: Solo si `cobros.ver === true`
- **Usuarios**: Solo si `usuarios.ver === true`
- **Roles**: Solo si `roles.ver === true`

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Compilar para producción
npm run build

# Preview de producción
npm run preview

# Lint
npm run lint
```

## 📦 Dependencias Principales

- **React 18**: Librería UI
- **TypeScript**: Tipado estático
- **Vite**: Build tool
- **React Router v6**: Enrutamiento
- **Axios**: HTTP client
- **Tailwind CSS**: Estilos
- **shadcn/ui**: Componentes UI
- **Lucide React**: Iconos

## 🎯 Mejores Prácticas

1. **Siempre usar `<ProtectedRoute>`** para rutas que requieren autenticación
2. **Usar `<ProtectedAction>`** para botones de edición/creación
3. **Verificar permisos en el Context** antes de mostrar opciones
4. **Manejar errores** con try-catch y mostrar mensajes al usuario
5. **Validar formularios** antes de enviar al backend
6. **Usar TypeScript** para todas las interfaces y tipos

## 🚀 Despliegue

### Producción con Nginx

1. Compilar la aplicación:
```bash
npm run build
```

2. Los archivos compilados estarán en `dist/`

3. Configurar Nginx:
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /ruta/a/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy para API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. Reiniciar Nginx:
```bash
sudo systemctl restart nginx
```

## 🔐 Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://tu-servidor:3000/api
```

Luego actualizar `services/api.ts`:
```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});
```

## 📝 Notas Importantes

1. **El backend debe estar corriendo** antes de iniciar el frontend
2. **Configurar CORS** en el backend para permitir peticiones del frontend
3. **Todos los usuarios deben tener sucursal asignada** para poder crear benefactores
4. **Los números de contrato son únicos** y se generan secuencialmente por sucursal
5. **El token JWT expira** según la configuración del backend (default: 24h)
6. **Los permisos se validan tanto en frontend como backend** para mayor seguridad

## 🐛 Troubleshooting

### Error: "Usuario no tiene sucursal asignada"
**Solución:** Ir a `/usuarios` y asignar una sucursal al usuario que intenta crear benefactores.

### Error: "Token inválido" o redirección constante al login
**Solución:** El token expiró. Hacer logout y volver a iniciar sesión.

### No aparecen opciones en el menú
**Solución:** Verificar que el rol del usuario tenga permisos `puede_ver` configurados para esos recursos.

### Error de CORS
**Solución:** Configurar CORS en el backend para permitir el origen del frontend.

## 📞 Soporte

Para cualquier consulta o problema:
- Revisar logs del navegador (F12 → Console)
- Verificar que el backend esté corriendo y accesible
- Consultar documentación del backend en `backend/README.md`
