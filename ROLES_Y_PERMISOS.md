# Sistema de Roles y Permisos - Frontend

## 📋 Índice
1. [Arquitectura General](#arquitectura-general)
2. [Roles del Sistema](#roles-del-sistema)
3. [Permisos Granulares](#permisos-granulares)
4. [Componentes de Protección](#componentes-de-protección)
5. [AuthContext](#authcontext)
6. [Ejemplos de Uso](#ejemplos-de-uso)
7. [Flujo de Autenticación](#flujo-de-autenticación)
8. [Estructura de Archivos](#estructura-de-archivos)

---

## 🏗️ Arquitectura General

El sistema de roles y permisos está diseñado con **dos niveles de control**:

1. **Control por Rol (Role-Based Access Control - RBAC)**: Acceso a rutas/módulos completos
2. **Control por Permiso Granular**: Acceso a acciones específicas dentro de cada recurso (ver/editar)

### Flujo de Datos
```
Login → Backend valida credenciales
     → Devuelve token + usuario (con roles)
     → Frontend obtiene permisos desde /auth/mis-permisos
     → Guarda en localStorage y AuthContext
     → Renderiza UI según permisos
```

---

## 👥 Roles del Sistema

Los roles se definen en el **backend** y se asignan a los usuarios en la tabla `usuarios_roles`.

### Roles Disponibles

| Rol | ID | Descripción |
|-----|-----|-------------|
| **ADMINISTRADOR** | 1 | Acceso total al sistema, gestión de usuarios y permisos |
| **EJECUTIVO** | 2 | Gestión de benefactores, aprobaciones, cartera limitada |
| **COBROS** | 3 | Gestión de cobros, aportes y cartera financiera |
| **SOCIAL** | 4 | Acceso a módulo social, reportes de benefactores |

### Archivo de Definición
**Backend**: `backend/src/config/roles.json`
```json
{
  "roles": [
    {
      "id_rol": 1,
      "nombre": "ADMINISTRADOR",
      "descripcion": "Acceso completo al sistema"
    },
    {
      "id_rol": 2,
      "nombre": "EJECUTIVO",
      "descripcion": "Gestión de benefactores y aprobaciones"
    },
    {
      "id_rol": 3,
      "nombre": "COBROS",
      "descripcion": "Gestión de cobros y cartera"
    },
    {
      "id_rol": 4,
      "nombre": "SOCIAL",
      "descripcion": "Módulo social y reportes"
    }
  ]
}
```

---

## 🔐 Permisos Granulares

Los permisos se asignan **por recurso y acción** en el archivo `backend/src/config/permisos.json`.

### Estructura de Permisos

```typescript
interface Permisos {
  [recurso: string]: {
    ver: boolean;      // Puede ver el recurso
    editar: boolean;   // Puede crear/editar/eliminar
  }
}
```

### Recursos Disponibles

| Recurso | Descripción |
|---------|-------------|
| `dashboard` | Panel principal con estadísticas |
| `benefactores` | Gestión de titulares y dependientes |
| `aprobaciones` | Aprobación de nuevos benefactores |
| `cartera` | Gestión de aportes y cobros |
| `social` | Módulo de trabajo social |
| `reportes` | Reportes y exportaciones |
| `usuarios` | Gestión de usuarios del sistema |
| `roles` | Gestión de roles y permisos |
| `sucursales` | Gestión de sucursales |

### Ejemplo de Configuración (Backend)
**Archivo**: `backend/src/config/permisos.json`
```json
{
  "ADMINISTRADOR": {
    "dashboard": { "ver": true, "editar": true },
    "benefactores": { "ver": true, "editar": true },
    "aprobaciones": { "ver": true, "editar": true },
    "cartera": { "ver": true, "editar": true },
    "social": { "ver": true, "editar": true },
    "reportes": { "ver": true, "editar": true },
    "usuarios": { "ver": true, "editar": true },
    "roles": { "ver": true, "editar": true },
    "sucursales": { "ver": true, "editar": true }
  },
  "EJECUTIVO": {
    "dashboard": { "ver": true, "editar": false },
    "benefactores": { "ver": true, "editar": true },
    "aprobaciones": { "ver": true, "editar": false },
    "cartera": { "ver": true, "editar": false },
    "social": { "ver": false, "editar": false },
    "reportes": { "ver": false, "editar": false },
    "usuarios": { "ver": false, "editar": false },
    "roles": { "ver": false, "editar": false },
    "sucursales": { "ver": false, "editar": false }
  },
  "COBROS": {
    "dashboard": { "ver": true, "editar": false },
    "benefactores": { "ver": true, "editar": false },
    "aprobaciones": { "ver": false, "editar": false },
    "cartera": { "ver": true, "editar": true },
    "social": { "ver": false, "editar": false },
    "reportes": { "ver": true, "editar": false },
    "usuarios": { "ver": false, "editar": false },
    "roles": { "ver": false, "editar": false },
    "sucursales": { "ver": false, "editar": false }
  },
  "SOCIAL": {
    "dashboard": { "ver": true, "editar": false },
    "benefactores": { "ver": true, "editar": false },
    "aprobaciones": { "ver": false, "editar": false },
    "cartera": { "ver": false, "editar": false },
    "social": { "ver": true, "editar": true },
    "reportes": { "ver": true, "editar": false },
    "usuarios": { "ver": false, "editar": false },
    "roles": { "ver": false, "editar": false },
    "sucursales": { "ver": false, "editar": false }
  }
}
```

---

## 🛡️ Componentes de Protección

### 1. ProtectedRoute

Protege **rutas completas** basándose en roles del usuario.

**Ubicación**: `frontend/components/ProtectedRoute.tsx`

#### Uso Básico
```tsx
import { ProtectedRoute } from './components/ProtectedRoute';

// Ruta accesible por cualquier usuario autenticado
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />

// Ruta solo para ADMINISTRADOR
<Route path="/usuarios" element={
  <ProtectedRoute requiredRoles={['ADMINISTRADOR']}>
    <Usuarios />
  </ProtectedRoute>
} />

// Ruta para ADMINISTRADOR o EJECUTIVO
<Route path="/benefactores" element={
  <ProtectedRoute requiredRoles={['ADMINISTRADOR', 'EJECUTIVO']}>
    <Benefactores />
  </ProtectedRoute>
} />
```

#### Props
| Prop | Tipo | Descripción |
|------|------|-------------|
| `children` | `ReactNode` | Componente a proteger |
| `requiredRoles` | `string[]` | Array de roles permitidos (opcional) |

#### Comportamiento
- ✅ Usuario autenticado + rol válido → Renderiza children
- ❌ Usuario no autenticado → Redirige a `/login`
- ❌ Usuario sin rol requerido → Muestra mensaje "Acceso Denegado"
- ⏳ Cargando → Muestra spinner

---

### 2. ProtectedAction

Protege **acciones específicas** dentro de un componente basándose en permisos granulares.

**Ubicación**: `frontend/components/ProtectedAction.tsx`

#### Uso Básico
```tsx
import { ProtectedAction } from './components/ProtectedAction';

// Mostrar botón solo si tiene permiso para editar benefactores
<ProtectedAction recurso="benefactores" accion="editar">
  <Button onClick={handleCrear}>
    <Plus className="h-4 w-4 mr-2" />
    Nuevo Benefactor
  </Button>
</ProtectedAction>

// Mostrar sección solo si puede ver cartera
<ProtectedAction recurso="cartera" accion="ver">
  <Card>
    <CardHeader>
      <CardTitle>Estado de Cartera</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Contenido de cartera */}
    </CardContent>
  </Card>
</ProtectedAction>

// Con fallback alternativo
<ProtectedAction 
  recurso="usuarios" 
  accion="editar"
  fallback={<p className="text-gray-500">No tienes permisos para gestionar usuarios</p>}
>
  <Button variant="destructive" onClick={handleEliminar}>
    Eliminar Usuario
  </Button>
</ProtectedAction>
```

#### Props
| Prop | Tipo | Descripción |
|------|------|-------------|
| `children` | `ReactNode` | Elemento a proteger |
| `recurso` | `string` | Nombre del recurso (ej: 'benefactores', 'cartera') |
| `accion` | `'ver' \| 'editar'` | Tipo de acción (default: 'editar') |
| `fallback` | `ReactNode` | Componente alternativo si no tiene permiso (default: null) |

#### Comportamiento
- ✅ Tiene permiso → Renderiza children
- ❌ No tiene permiso → Renderiza fallback (o null)

---

## 🔄 AuthContext

**Ubicación**: `frontend/contexts/AuthContext.tsx`

### Estado Global

```typescript
interface AuthContextType {
  user: Usuario | null;           // Datos del usuario autenticado
  permisos: Permisos | null;      // Permisos granulares del usuario
  loading: boolean;                // Estado de carga
  login: (username, password) => Promise<void>;
  logout: () => void;
  refreshPermisos: () => Promise<void>;
}
```

### Propiedades del Usuario

```typescript
interface Usuario {
  id_usuario: number;
  nombre_usuario: string;
  roles: Rol[];                    // Array de roles asignados
}

interface Rol {
  id_rol: number;
  nombre: string;                  // 'ADMINISTRADOR', 'EJECUTIVO', etc.
}
```

### Hook de Uso

```tsx
import { useAuth } from '../contexts/AuthContext';

function MiComponente() {
  const { user, permisos, loading, logout } = useAuth();

  // Verificar rol específico
  const esAdmin = user?.roles?.some(r => r.nombre === 'ADMINISTRADOR');

  // Verificar permiso granular
  const puedeEditarBenefactores = permisos?.benefactores?.editar;

  return (
    <div>
      <p>Usuario: {user?.nombre_usuario}</p>
      {esAdmin && <AdminPanel />}
      {puedeEditarBenefactores && <CrearBenefactorButton />}
    </div>
  );
}
```

---

## 📝 Ejemplos de Uso

### Ejemplo 1: Menú de Navegación Condicional

```tsx
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router';

export const Sidebar = () => {
  const { user, permisos } = useAuth();

  return (
    <nav>
      {/* Siempre visible para autenticados */}
      <Link to="/dashboard">Dashboard</Link>

      {/* Solo si puede ver benefactores */}
      {permisos?.benefactores?.ver && (
        <Link to="/benefactores">Benefactores</Link>
      )}

      {/* Solo para ADMINISTRADOR */}
      {user?.roles?.some(r => r.nombre === 'ADMINISTRADOR') && (
        <Link to="/configuracion">Configuración</Link>
      )}

      {/* Solo si puede ver cartera */}
      {permisos?.cartera?.ver && (
        <Link to="/cartera">Cartera de Aportes</Link>
      )}

      {/* Solo si puede ver reportes */}
      {permisos?.reportes?.ver && (
        <Link to="/reportes">Reportes</Link>
      )}
    </nav>
  );
};
```

### Ejemplo 2: Botones de Acción Condicionales

```tsx
import { ProtectedAction } from './components/ProtectedAction';
import { useAuth } from './contexts/AuthContext';

export const BenefactorCard = ({ benefactor }) => {
  const { user } = useAuth();
  const esAdmin = user?.roles?.some(r => r.nombre === 'ADMINISTRADOR');

  return (
    <Card>
      <CardContent>
        <h3>{benefactor.nombre_completo}</h3>
        
        {/* Ver detalles - disponible si puede ver benefactores */}
        <ProtectedAction recurso="benefactores" accion="ver">
          <Button variant="outline" onClick={handleVerDetalles}>
            Ver Detalles
          </Button>
        </ProtectedAction>

        {/* Editar - solo si puede editar benefactores */}
        <ProtectedAction recurso="benefactores" accion="editar">
          <Button onClick={handleEditar}>
            Editar
          </Button>
        </ProtectedAction>

        {/* Eliminar - solo para ADMINISTRADOR */}
        {esAdmin && (
          <Button variant="destructive" onClick={handleEliminar}>
            Eliminar
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
```

### Ejemplo 3: Rutas Protegidas con Router

```tsx
import { Routes, Route } from 'react-router';
import { ProtectedRoute } from './components/ProtectedRoute';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/login" element={<Login />} />

      {/* Rutas protegidas - requieren autenticación */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      {/* Ruta para ADMINISTRADOR o EJECUTIVO */}
      <Route path="/benefactores/*" element={
        <ProtectedRoute requiredRoles={['ADMINISTRADOR', 'EJECUTIVO']}>
          <Benefactores />
        </ProtectedRoute>
      } />

      {/* Ruta solo para ADMINISTRADOR */}
      <Route path="/configuracion/*" element={
        <ProtectedRoute requiredRoles={['ADMINISTRADOR']}>
          <Configuracion />
        </ProtectedRoute>
      } />

      {/* Ruta para roles con acceso a cartera */}
      <Route path="/cartera" element={
        <ProtectedRoute requiredRoles={['ADMINISTRADOR', 'COBROS']}>
          <Cartera />
        </ProtectedRoute>
      } />

      {/* Ruta 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
```

### Ejemplo 4: Verificación Programática

```tsx
import { useAuth } from '../contexts/AuthContext';

export const MiComponente = () => {
  const { user, permisos } = useAuth();

  const handleAccion = () => {
    // Verificar permisos antes de ejecutar acción
    if (!permisos?.benefactores?.editar) {
      toast.error('No tienes permisos para realizar esta acción');
      return;
    }

    // Ejecutar acción
    realizarAccion();
  };

  const puedeAprobar = () => {
    // Verificación compleja de múltiples condiciones
    const esAdmin = user?.roles?.some(r => r.nombre === 'ADMINISTRADOR');
    const tienePermisoAprobaciones = permisos?.aprobaciones?.editar;
    
    return esAdmin || tienePermisoAprobaciones;
  };

  return (
    <div>
      {puedeAprobar() && (
        <Button onClick={handleAprobar}>Aprobar Solicitud</Button>
      )}
    </div>
  );
};
```

---

## 🔄 Flujo de Autenticación

### 1. Login

```
Usuario ingresa credenciales
    ↓
POST /auth/login
    ↓
Backend valida credenciales
    ↓
Devuelve: { token, usuario: { id, nombre, roles: [...] } }
    ↓
Frontend guarda en localStorage:
  - fpus_token: "jwt_token_aqui"
  - fpus_user: { id, nombre, roles }
    ↓
GET /auth/mis-permisos (con token en header)
    ↓
Backend busca permisos según rol del usuario
    ↓
Devuelve: { permisos: { recurso: { ver, editar }, ... } }
    ↓
Frontend guarda en localStorage:
  - fpus_permisos: { benefactores: { ver: true, editar: true }, ... }
    ↓
AuthContext actualiza estado global
    ↓
UI se renderiza según permisos
```

### 2. Verificación de Permisos

```
Usuario intenta acceder a una ruta/acción
    ↓
ProtectedRoute/ProtectedAction consulta AuthContext
    ↓
¿Usuario autenticado?
  NO → Redirigir a /login
  SÍ → Continuar
    ↓
¿Tiene rol requerido? (solo ProtectedRoute)
  NO → Mostrar "Acceso Denegado"
  SÍ → Continuar
    ↓
¿Tiene permiso para recurso/acción? (solo ProtectedAction)
  NO → Renderizar fallback (o null)
  SÍ → Renderizar children
```

### 3. Refresh de Permisos

Si un administrador cambia los permisos de un rol:

```tsx
const { refreshPermisos } = useAuth();

// Después de cambiar permisos en backend
await permisosService.actualizarPermisos(rolId, nuevosPermisos);

// Refrescar permisos en frontend
await refreshPermisos();

toast.success('Permisos actualizados correctamente');
```

---

## 📁 Estructura de Archivos

```
frontend/
├── contexts/
│   └── AuthContext.tsx              # Contexto global de autenticación
│
├── components/
│   ├── ProtectedRoute.tsx           # Protección de rutas por rol
│   ├── ProtectedAction.tsx          # Protección de acciones por permiso
│   └── Layout.tsx                   # Layout con navegación condicional
│
├── services/
│   ├── auth.service.ts              # Servicio de autenticación
│   │   ├── login()
│   │   ├── logout()
│   │   ├── isAuthenticated()
│   │   ├── getUser()
│   │   ├── saveAuth()
│   │   └── clearAuth()
│   │
│   └── permisos.service.ts          # Servicio de permisos
│       ├── getMisPermisos()
│       ├── getPermisos()
│       └── savePermisos()
│
├── utils/
│   └── permissions.ts               # Utilidades de permisos (legacy)
│
└── types/
    └── index.ts                     # Tipos TypeScript
        ├── Usuario
        ├── Rol
        └── Permisos

backend/
├── src/
│   ├── config/
│   │   ├── roles.json               # Definición de roles
│   │   └── permisos.json            # Mapa de permisos por rol
│   │
│   ├── controllers/
│   │   ├── auth.controller.js       # Login, obtener mis permisos
│   │   └── permisos.controller.js   # CRUD de permisos
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js       # Verificar token JWT
│   │   └── permisos.middleware.js   # Verificar permisos
│   │
│   └── routes/
│       ├── auth.routes.js           # POST /auth/login, GET /auth/mis-permisos
│       └── permisos.routes.js       # GET/PUT /permisos/:rol
│
└── base/
    └── basescript.sql               # Creación de tablas usuarios_roles
```

---

## 🔧 Configuración

### Variables de localStorage

| Clave | Contenido | Ejemplo |
|-------|-----------|---------|
| `fpus_token` | Token JWT | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `fpus_user` | Usuario serializado | `{"id_usuario":1,"nombre_usuario":"admin","roles":[...]}` |
| `fpus_permisos` | Permisos serializados | `{"benefactores":{"ver":true,"editar":true},...}` |

### Headers HTTP

Todas las peticiones autenticadas incluyen:
```
Authorization: Bearer <token_jwt>
```

---

## ⚠️ Consideraciones de Seguridad

1. **Validación en Backend**: SIEMPRE validar permisos en el backend. El frontend solo oculta/muestra UI.

2. **Token Expiration**: Los tokens JWT expiran. Implementar refresh token si es necesario.

3. **No confiar en localStorage**: Un usuario puede modificar localStorage. La seguridad real está en el backend.

4. **Permisos vs Roles**:
   - **Roles**: Para control de acceso a módulos completos
   - **Permisos**: Para control granular de acciones específicas

5. **Caché de Permisos**: Los permisos se guardan en localStorage. Si se cambian en backend, el usuario debe:
   - Cerrar sesión y volver a iniciar, O
   - Llamar a `refreshPermisos()`

---

## 🚀 Mejores Prácticas

### ✅ Hacer

```tsx
// ✅ Usar ProtectedRoute para rutas completas
<Route path="/admin" element={
  <ProtectedRoute requiredRoles={['ADMINISTRADOR']}>
    <AdminPanel />
  </ProtectedRoute>
} />

// ✅ Usar ProtectedAction para botones/elementos específicos
<ProtectedAction recurso="benefactores" accion="editar">
  <Button>Editar</Button>
</ProtectedAction>

// ✅ Verificar permisos antes de acciones importantes
const handleDelete = () => {
  if (!permisos?.usuarios?.editar) {
    toast.error('Sin permisos');
    return;
  }
  deleteUser();
};

// ✅ Usar fallback en ProtectedAction
<ProtectedAction 
  recurso="reportes" 
  accion="ver"
  fallback={<p>No tienes acceso a reportes</p>}
>
  <ReportesPanel />
</ProtectedAction>
```

### ❌ Evitar

```tsx
// ❌ Validar solo en frontend
const handleDelete = () => {
  deleteUser(); // Backend debe validar permisos también
};

// ❌ Hardcodear verificaciones de roles
if (user.nombre_usuario === 'admin') { // Usar roles en su lugar
  // ...
}

// ❌ No manejar estados de carga
const { user } = useAuth();
return user.nombre; // Puede ser null mientras carga

// ✅ Mejor
const { user, loading } = useAuth();
if (loading) return <Spinner />;
return user?.nombre || 'Invitado';
```

---

## 📞 Contacto y Soporte

Para modificar roles o permisos:
1. Backend: Editar `backend/src/config/permisos.json`
2. Reiniciar servidor backend
3. Usuarios deben cerrar sesión y volver a iniciar (o llamar `refreshPermisos()`)

---

## 📚 Referencias

- [AuthContext.tsx](contexts/AuthContext.tsx)
- [ProtectedRoute.tsx](components/ProtectedRoute.tsx)
- [ProtectedAction.tsx](components/ProtectedAction.tsx)
- [auth.service.ts](services/auth.service.ts)
- [permisos.service.ts](services/permisos.service.ts)
