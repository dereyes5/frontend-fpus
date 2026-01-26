# Prompt para Desarrollo del Frontend - API de Gestión de Benefactores

## Contexto del Proyecto

Necesito crear un frontend completo en React con TypeScript para consumir una API REST de gestión de benefactores. La aplicación debe tener autenticación JWT, sistema de roles y permisos dinámicos, y múltiples módulos.

## Stack Tecnológico Requerido

- **Framework**: React 18+ con TypeScript
- **Routing**: React Router v6
- **Estado Global**: Context API o Redux Toolkit
- **UI Library**: Material-UI (MUI) v5 o Ant Design
- **HTTP Client**: Axios
- **Autenticación**: JWT en localStorage
- **Formularios**: React Hook Form + Yup/Zod
- **Notificaciones**: React Toastify o similar

## Información del Backend

### Base URL
```
http://154.12.234.100:3000/api
```

### Autenticación

Todos los endpoints (excepto login y crear usuario) requieren token JWT en el header:
```
Authorization: Bearer {token}
```

El token se obtiene del endpoint de login y debe almacenarse en localStorage.

---

## Endpoints Disponibles

### 1. Autenticación

#### Login (Público)
```http
POST /api/auth/login
Content-Type: application/json

Body:
{
  "nombre_usuario": "PRODRIGUEZ",
  "password": "mi_password"
}

Response:
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
      "id_usuario": 1,
      "nombre_usuario": "PRODRIGUEZ",
      "roles": [
        {
          "id_rol": 1,
          "nombre": "EJECUTIVO"
        }
      ]
    }
  }
}
```

#### Crear Usuario (Público)
```http
POST /api/auth/usuarios
Content-Type: application/json

Body:
{
  "nombre_usuario": "nuevousuario",
  "password": "password123"
}
```

#### Obtener Perfil (Requiere Token)
```http
GET /api/auth/perfil
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "id_usuario": 1,
    "nombre_usuario": "PRODRIGUEZ",
    "roles": [...]
  }
}
```

#### Cambiar Contraseña (Requiere Token)
```http
PUT /api/auth/cambiar-password
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "password_actual": "mi_password_actual",
  "password_nueva": "mi_password_nueva"
}
```

#### Asignar Rol a Usuario (Requiere Token)
```http
POST /api/auth/usuarios/asignar-rol
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "id_usuario": 5,
  "id_rol": 1
}
```

---

### 2. Roles

#### Listar Roles
```http
GET /api/roles
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id_rol": 1,
      "nombre": "EJECUTIVO"
    }
  ]
}
```

#### Crear Rol
```http
POST /api/roles
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "nombre": "ADMINISTRADOR"
}
```

#### Actualizar Rol
```http
PUT /api/roles/:id
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "nombre": "SUPERVISOR"
}
```

#### Eliminar Rol
```http
DELETE /api/roles/:id
Authorization: Bearer {token}
```

---

### 3. Permisos

#### Obtener Mis Permisos (Usuario Actual)
```http
GET /api/permisos/mis-permisos
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "rol": {
      "id_rol": 1,
      "nombre": "EJECUTIVO"
    },
    "permisos": {
      "benefactores": { "ver": true, "editar": true },
      "aprobaciones": { "ver": true, "editar": true },
      "cobros": { "ver": true, "editar": false },
      "usuarios": { "ver": false, "editar": false },
      "roles": { "ver": false, "editar": false }
    },
    "recursos": [
      {
        "id": "benefactores",
        "nombre": "Benefactores",
        "descripcion": "Gestión de benefactores y dependientes"
      }
    ]
  }
}
```

#### Obtener Recursos Disponibles
```http
GET /api/permisos/recursos
Authorization: Bearer {token}
```

#### Obtener Permisos de un Rol
```http
GET /api/permisos/roles/:id
Authorization: Bearer {token}
```

#### Actualizar Permisos de un Rol
```http
PUT /api/permisos/roles/:id
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "permisos": {
    "benefactores": { "ver": true, "editar": true },
    "aprobaciones": { "ver": true, "editar": false },
    "cobros": { "ver": true, "editar": false },
    "usuarios": { "ver": false, "editar": false },
    "roles": { "ver": false, "editar": false }
  }
}
```

---

### 4. Benefactores

#### Listar Benefactores
```http
GET /api/benefactores?tipo_benefactor=TITULAR&estado_registro=PENDIENTE&page=1&limit=50
Authorization: Bearer {token}

Query Params (todos opcionales):
- tipo_benefactor: TITULAR | DEPENDIENTE
- estado_registro: PENDIENTE | APROBADO | RECHAZADO
- page: número de página (default: 1)
- limit: registros por página (default: 50)

Response:
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

#### Obtener Benefactor por ID
```http
GET /api/benefactores/:id
Authorization: Bearer {token}
```

#### Crear Benefactor
```http
POST /api/benefactores
Authorization: Bearer {token}
Content-Type: application/json

Body (Titular):
{
  "tipo_benefactor": "TITULAR",
  "nombre_completo": "Juan Pérez García",
  "cedula": "1234567890",
  "email": "juan.perez@example.com",
  "telefono": "0987654321",
  "direccion": "Calle Principal 123",
  "ciudad": "Santo Domingo",
  "provincia": "Santo Domingo",
  "fecha_nacimiento": "1990-05-15",
  "fecha_suscripcion": "2024-01-10",
  "tipo_afiliacion": "INDIVIDUAL",
  "inscripcion": 4.99,
  "aporte": 4.99,
  "estado": "ACTIVO"
}

Body (Dependiente):
{
  "tipo_benefactor": "DEPENDIENTE",
  "nombre_completo": "Carlos González Pérez",
  "cedula": "2351234567",
  "direccion": "Av. Principal 456",
  "ciudad": "Santo Domingo",
  "provincia": "Santo Domingo",
  "fecha_nacimiento": "2010-07-15",
  "inscripcion": 0.00,
  "aporte": 1.99,
  "estado": "ACTIVO"
}
```

#### Actualizar Benefactor
```http
PUT /api/benefactores/:id
Authorization: Bearer {token}
Content-Type: application/json

Body (campos opcionales):
{
  "telefono": "0999888777",
  "email": "nuevo.email@example.com"
}
```

#### Eliminar Benefactor
```http
DELETE /api/benefactores/:id
Authorization: Bearer {token}
```

#### Asignar Dependiente a Titular
```http
POST /api/benefactores/asignar-dependiente
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "id_titular": 1,
  "id_dependiente": 6
}
```

#### Obtener Dependientes de un Titular
```http
GET /api/benefactores/:id/dependientes
Authorization: Bearer {token}
```

---

### 5. Aprobaciones

#### Listar Aprobaciones
```http
GET /api/aprobaciones?estado_aprobacion=APROBADO&page=1&limit=50
Authorization: Bearer {token}
```

#### Obtener Registros Pendientes
```http
GET /api/aprobaciones/pendientes?page=1&limit=50
Authorization: Bearer {token}
```

#### Aprobar o Rechazar Registro
```http
POST /api/aprobaciones
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "id_benefactor": 1,
  "estado_aprobacion": "APROBADO",  // o "RECHAZADO"
  "comentario": "Documentación completa y verificada"
}
```

#### Obtener Historial de Aprobaciones
```http
GET /api/aprobaciones/benefactor/:id
Authorization: Bearer {token}
```

---

### 6. Cobros y Saldos

#### Obtener Lista de Benefactores (para cobros)
```http
GET /api/cobros/benefactores
Authorization: Bearer {token}
```

#### Obtener Estado de Pagos del Mes Actual
```http
GET /api/cobros/estado/actual
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id_benefactor": 1,
      "nombre_completo": "Juan Pérez García",
      "cedula": "1234567890",
      "monto_a_pagar": "4.99",
      "monto_pagado": "4.99",
      "saldo_pendiente": "0.00",
      "estado_pago": "PAGADO",  // PAGADO | PAGO_PARCIAL | NO_PAGADO
      "ultima_fecha_pago": "2025-10-15"
    }
  ],
  "total": 150,
  "mes": 10,
  "anio": 2025
}
```

#### Obtener Morosos (No Pagaron)
```http
GET /api/cobros/morosos
Authorization: Bearer {token}
```

#### Obtener Pagados
```http
GET /api/cobros/pagados
Authorization: Bearer {token}
```

#### Obtener Pagos Parciales
```http
GET /api/cobros/pagos-parciales
Authorization: Bearer {token}
```

#### Obtener Estadísticas del Mes
```http
GET /api/cobros/estadisticas
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "total_titulares": "150",
    "pagados": "120",
    "parciales": "15",
    "no_pagados": "15",
    "total_esperado": "747.50",
    "total_recaudado": "620.25",
    "total_pendiente": "127.25",
    "porcentaje_recaudacion": "83.00"
  }
}
```

#### Registrar Cobros (desde archivo del banco)
```http
POST /api/cobros/cobros
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "cobros": [
    {
      "id_benefactor": 1,
      "fecha_transmision": "2025-10-15",
      "fecha_pago": "2025-10-25",
      "cod_tercero": "SD0002",
      "estado": "Proceso O.K.",
      "moneda": "DOLAR",
      "forma_pago": "CREDITO",
      "valor_cobrado": 4.99,
      "empresa": "FUNDACION PO",
      "tipo_movimiento": "Cobro",
      "pais": "Ecuador",
      "banco": "Banco Pichincha",
      "tipo_cuenta": "AHORRO",
      "num_cuenta": "2207501161",
      "observaciones": "Cobro mensual"
    }
  ]
}
```

#### Obtener Cobros Registrados
```http
GET /api/cobros/cobros?id_benefactor=1&estado=Proceso O.K.&page=1&limit=50
Authorization: Bearer {token}
```

#### Obtener Historial de un Benefactor
```http
GET /api/cobros/benefactores/:id/historial
Authorization: Bearer {token}
```

#### Obtener Saldo Actual de un Benefactor
```http
GET /api/cobros/benefactores/:id/saldo
Authorization: Bearer {token}
```

---

## Requisitos del Frontend

### 1. Estructura de Carpetas Requerida

```
src/
├── components/
│   ├── common/          # Componentes reutilizables
│   ├── layout/          # Layout, Header, Sidebar, Footer
│   └── forms/           # Componentes de formularios
├── pages/
│   ├── Login/
│   ├── Dashboard/
│   ├── Benefactores/
│   ├── Aprobaciones/
│   ├── Cobros/
│   ├── Usuarios/
│   ├── Roles/
│   └── Permisos/
├── services/
│   ├── api.ts           # Configuración de Axios
│   ├── auth.service.ts
│   ├── benefactores.service.ts
│   ├── cobros.service.ts
│   └── permisos.service.ts
├── contexts/
│   ├── AuthContext.tsx
│   └── PermisosContext.tsx
├── hooks/
│   ├── useAuth.ts
│   └── usePermisos.ts
├── types/
│   └── index.ts         # TypeScript interfaces
├── utils/
│   ├── constants.ts
│   └── helpers.ts
└── App.tsx
```

### 2. Funcionalidades Críticas

#### Autenticación
- Página de login con formulario de usuario/contraseña
- Guardar token JWT en localStorage al hacer login
- Interceptor de Axios para agregar token automáticamente a todas las peticiones
- Redirección a login si token expiró (401)
- Logout que limpia localStorage y redirige a login

#### Sistema de Permisos Dinámico
- Al hacer login, obtener permisos del usuario con `/api/permisos/mis-permisos`
- Guardar permisos en Context/Redux
- HOC o componente `<ProtectedRoute>` que verifica `puede_ver`
- HOC o componente `<ProtectedAction>` que verifica `puede_editar` para botones/acciones
- Ocultar completamente módulos/páginas si `puede_ver: false`
- Deshabilitar botones de edición si `puede_editar: false`

#### Módulo de Benefactores
- Tabla con paginación, filtros (tipo, estado), búsqueda
- Formulario de creación (diferente para TITULAR vs DEPENDIENTE)
- Formulario de edición
- Vista de detalle con información completa
- Asignación de dependientes a titulares
- Lista de dependientes de un titular

#### Módulo de Aprobaciones
- Lista de registros pendientes
- Botones de Aprobar/Rechazar con modal de confirmación y comentario
- Historial de aprobaciones de un benefactor
- Filtros por estado de aprobación

#### Módulo de Cobros y Pagos
- Dashboard con estadísticas (KPIs):
  - Total esperado, total recaudado, pendiente
  - Porcentaje de recaudación
  - Contadores: pagados, parciales, morosos
- Tabs para: Todos, Pagados, Parciales, Morosos
- Tabla de benefactores con estado de pago
- Colores según estado: verde (PAGADO), amarillo (PARCIAL), rojo (NO_PAGADO)
- Formulario para cargar archivo de cobros del banco
- Historial de pagos de un benefactor

#### Módulo de Usuarios (si tiene permiso)
- Crear nuevos usuarios
- Asignar roles a usuarios
- Cambiar contraseña propia

#### Módulo de Roles y Permisos (si tiene permiso)
- CRUD de roles
- Configuración de permisos por rol:
  - Lista de recursos (benefactores, aprobaciones, cobros, usuarios, roles)
  - Checkboxes para "ver" y "editar" por cada recurso
  - Guardar permisos con PUT /api/permisos/roles/:id

### 3. Layout y Navegación

- **Sidebar/Menu lateral** con:
  - Dashboard
  - Benefactores (solo si puede_ver)
  - Aprobaciones (solo si puede_ver)
  - Cobros y Pagos (solo si puede_ver)
  - Usuarios (solo si puede_ver)
  - Roles y Permisos (solo si puede_ver)
  
- **Header/Navbar** con:
  - Logo/Nombre de la app
  - Usuario actual (nombre_usuario)
  - Botón de perfil (cambiar contraseña)
  - Botón de logout

- **Responsive**: Sidebar colapsable en mobile

### 4. Manejo de Errores

- Mostrar notificaciones toast para éxito/error
- Interceptor de Axios para capturar errores:
  - 401: Redirigir a login
  - 403: Mostrar mensaje "No tienes permisos"
  - 500: Mostrar error genérico
- Validación de formularios con mensajes claros

### 5. UX/UI

- Loading spinners durante peticiones
- Confirmaciones antes de eliminar
- Formularios con validación en tiempo real
- Tablas con ordenamiento y paginación
- Breadcrumbs en páginas internas
- Estados vacíos con mensajes amigables

---

## TypeScript Interfaces Clave

```typescript
interface Usuario {
  id_usuario: number;
  nombre_usuario: string;
  roles: Rol[];
}

interface Rol {
  id_rol: number;
  nombre: string;
}

interface Permisos {
  [recurso: string]: {
    ver: boolean;
    editar: boolean;
  };
}

interface Benefactor {
  id_benefactor: number;
  tipo_benefactor: 'TITULAR' | 'DEPENDIENTE';
  nombre_completo: string;
  cedula: string;
  email?: string;
  telefono?: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  fecha_nacimiento: string;
  fecha_suscripcion?: string;
  tipo_afiliacion?: string;
  inscripcion: number;
  aporte: number;
  estado: 'ACTIVO' | 'INACTIVO';
  estado_registro: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
}

interface EstadoPago {
  id_benefactor: number;
  nombre_completo: string;
  cedula: string;
  monto_a_pagar: string;
  monto_pagado: string;
  saldo_pendiente: string;
  estado_pago: 'PAGADO' | 'PAGO_PARCIAL' | 'NO_PAGADO';
  ultima_fecha_pago?: string;
}

interface Estadisticas {
  total_titulares: string;
  pagados: string;
  parciales: string;
  no_pagados: string;
  total_esperado: string;
  total_recaudado: string;
  total_pendiente: string;
  porcentaje_recaudacion: string;
}
```

---

## Configuración de Axios

```typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://154.12.234.100:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## Flujo de Autenticación Esperado

1. Usuario ingresa a la app → Redirige a `/login`
2. Completa formulario y hace submit
3. POST a `/api/auth/login` → Recibe token y datos de usuario
4. Guarda token en localStorage
5. GET a `/api/permisos/mis-permisos` → Obtiene permisos
6. Guarda permisos en Context/State
7. Redirige a `/dashboard`
8. El layout renderiza menú según permisos (`puede_ver`)
9. Dentro de cada módulo, habilita/deshabilita acciones según `puede_editar`

---

## Consideraciones Importantes

1. **No crear usuarios sin autenticación**: El endpoint de crear usuario es público para permitir registro inicial, pero debe tener validación en el backend (ya implementada)

2. **Permisos granulares**: Respetar estrictamente los permisos del usuario. No mostrar opciones que el usuario no puede usar.

3. **Estado de benefactores**: Los benefactores nuevos se crean con `estado_registro: PENDIENTE` y necesitan aprobación.

4. **Formato de fechas**: Las fechas del backend vienen en formato ISO (YYYY-MM-DD). Mostrar en formato legible en UI.

5. **Paginación**: Todos los listados tienen paginación. Implementar controles de página anterior/siguiente.

6. **Feedback visual**: Siempre mostrar loading/spinners durante llamadas HTTP y notificaciones de éxito/error.

---

## Prompt de Ejecución

Usando toda la información anterior, genera un proyecto completo de React con TypeScript que:

1. Tenga la estructura de carpetas especificada
2. Implemente autenticación JWT con Context API
3. Implemente el sistema de permisos dinámico
4. Cree todas las páginas y componentes necesarios
5. Use Material-UI para los componentes de UI
6. Tenga formularios con validación
7. Implemente el servicio de API con Axios
8. Maneje errores correctamente
9. Sea responsive y tenga buena UX

El proyecto debe estar listo para ejecutar con `npm install` y `npm start`.
