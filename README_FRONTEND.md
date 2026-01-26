# Frontend - Sistema de Gestión de Benefactores FPUS

Sistema completo de gestión de benefactores desarrollado en React con TypeScript, conectado a API REST.

## 🚀 Características Implementadas

### ✅ Autenticación y Seguridad
- Login con JWT
- Gestión de sesiones con localStorage
- Interceptores de Axios para manejo automático de tokens
- Redirección automática en caso de token expirado
- Cambio de contraseña

### ✅ Sistema de Permisos Dinámicos
- Context API para gestión de permisos
- Protección de rutas según permisos
- Protección de acciones (botones/componentes) según permisos
- Menú dinámico basado en permisos del usuario

### ✅ Módulos Implementados

#### 1. Dashboard
- Estadísticas en tiempo real
- Total de benefactores
- Recaudación del mes
- Pendientes de aprobación
- Acciones rápidas según permisos

#### 2. Benefactores
- Listado completo con filtros
- Crear titular/dependiente
- Editar benefactores
- Ver detalles
- Asignar dependientes a titulares
- Paginación

#### 3. Aprobaciones
- Listado de registros pendientes
- Aprobar/Rechazar con comentarios
- Historial de aprobaciones
- Estados: Aprobado, Rechazado, Pendiente

#### 4. Cartera y Cobros
- Dashboard de estadísticas financieras
- Estado de pagos del mes
- Tabs: Todos, Pagados, Parciales, Morosos
- Colores según estado de pago
- Total recaudado vs esperado
- Porcentaje de recaudación

#### 5. Usuarios
- Crear nuevos usuarios
- Asignar roles a usuarios
- Listado de roles disponibles

#### 6. Roles y Permisos
- CRUD de roles
- Configuración de permisos por rol
- Matriz de permisos (ver/editar) por recurso
- Recursos: benefactores, aprobaciones, cobros, usuarios, roles

#### 7. Configuración
- Ver perfil de usuario
- Cambiar contraseña
- Información de usuario y roles

## 🛠️ Tecnologías Utilizadas

- **React 18** con TypeScript
- **React Router v6** para navegación
- **Axios** para peticiones HTTP
- **Context API** para estado global
- **Shadcn/ui** para componentes UI
- **Tailwind CSS** para estilos
- **Sonner** para notificaciones toast
- **Lucide React** para iconos

## 📁 Estructura del Proyecto

```
frontend/
├── components/
│   ├── ui/                      # Componentes UI base (shadcn)
│   ├── Layout.tsx               # Layout principal con sidebar
│   ├── Login.tsx                # Página de login
│   ├── Dashboard.tsx            # Dashboard principal
│   ├── Benefactores.tsx         # Gestión de benefactores
│   ├── BenefactorDetail.tsx     # Detalle de benefactor
│   ├── Aprobaciones.tsx         # Módulo de aprobaciones
│   ├── Cartera.tsx              # Módulo de cartera/cobros
│   ├── Usuarios.tsx             # Gestión de usuarios
│   ├── Roles.tsx                # Gestión de roles y permisos
│   ├── Configuracion.tsx        # Configuración de cuenta
│   ├── ProtectedRoute.tsx       # HOC para rutas protegidas
│   └── ProtectedAction.tsx      # HOC para acciones protegidas
├── contexts/
│   └── AuthContext.tsx          # Context de autenticación
├── services/
│   ├── api.ts                   # Configuración de Axios
│   ├── auth.service.ts          # Servicio de autenticación
│   ├── benefactores.service.ts  # Servicio de benefactores
│   ├── aprobaciones.service.ts  # Servicio de aprobaciones
│   ├── cobros.service.ts        # Servicio de cobros
│   ├── permisos.service.ts      # Servicio de permisos
│   └── roles.service.ts         # Servicio de roles
├── types/
│   └── index.ts                 # TypeScript interfaces
├── utils/
│   ├── routes.ts                # Configuración de rutas
│   ├── permissions.ts           # Utilidades de permisos
│   └── sedes-ecuador.ts         # Datos de sedes
└── App.tsx                      # Componente principal

## 🔧 Configuración

### Variables de Entorno

El sistema está configurado para conectarse a:
```
API Base URL: http://154.12.234.100:3000/api
```

### Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## 🔐 Sistema de Permisos

El sistema implementa permisos granulares por recurso:

### Recursos Disponibles
- `benefactores`: Gestión de benefactores
- `aprobaciones`: Aprobación de registros
- `cobros`: Cartera y cobros
- `usuarios`: Gestión de usuarios
- `roles`: Gestión de roles y permisos

### Niveles de Permiso por Recurso
- **Ver**: Permite acceder al módulo y ver información
- **Editar**: Permite crear, modificar y eliminar

### Ejemplo de Uso

```tsx
// Proteger una ruta completa
<Route 
  path="/benefactores" 
  element={<ProtectedRoute recurso="benefactores"><Benefactores /></ProtectedRoute>}
/>

// Proteger una acción específica
<ProtectedAction recurso="benefactores" accion="editar">
  <Button>Crear Benefactor</Button>
</ProtectedAction>
```

## 🔄 Flujo de Autenticación

1. Usuario ingresa credenciales en `/login`
2. Sistema envía POST a `/api/auth/login`
3. Backend retorna token JWT y datos de usuario
4. Token se guarda en localStorage
5. Sistema solicita permisos con GET `/api/permisos/mis-permisos`
6. Permisos se guardan en Context y localStorage
7. Usuario redirigido a dashboard
8. Menú y funcionalidades se renderizan según permisos

## 📊 Endpoints Principales Consumidos

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/perfil` - Obtener perfil
- `PUT /api/auth/cambiar-password` - Cambiar contraseña
- `POST /api/auth/usuarios` - Crear usuario
- `POST /api/auth/usuarios/asignar-rol` - Asignar rol

### Permisos
- `GET /api/permisos/mis-permisos` - Obtener permisos del usuario
- `GET /api/permisos/recursos` - Listar recursos
- `GET /api/permisos/roles/:id` - Obtener permisos de rol
- `PUT /api/permisos/roles/:id` - Actualizar permisos de rol

### Benefactores
- `GET /api/benefactores` - Listar benefactores
- `GET /api/benefactores/:id` - Obtener benefactor
- `POST /api/benefactores` - Crear benefactor
- `PUT /api/benefactores/:id` - Actualizar benefactor
- `DELETE /api/benefactores/:id` - Eliminar benefactor
- `POST /api/benefactores/asignar-dependiente` - Asignar dependiente
- `GET /api/benefactores/:id/dependientes` - Listar dependientes

### Aprobaciones
- `GET /api/aprobaciones/pendientes` - Listar pendientes
- `POST /api/aprobaciones` - Aprobar/Rechazar
- `GET /api/aprobaciones/benefactor/:id` - Historial

### Cobros
- `GET /api/cobros/estado/actual` - Estado actual de pagos
- `GET /api/cobros/estadisticas` - Estadísticas del mes
- `GET /api/cobros/pagados` - Benefactores pagados
- `GET /api/cobros/morosos` - Benefactores morosos
- `GET /api/cobros/pagos-parciales` - Pagos parciales

### Roles
- `GET /api/roles` - Listar roles
- `POST /api/roles` - Crear rol
- `PUT /api/roles/:id` - Actualizar rol
- `DELETE /api/roles/:id` - Eliminar rol

## 🎨 Componentes UI

El proyecto utiliza componentes de **shadcn/ui** personalizados con Tailwind:

- Button, Input, Label
- Card, Dialog, Alert
- Table, Tabs, Badge
- Select, Checkbox, Textarea
- Toast notifications (Sonner)

## 🔍 Características de UX/UI

- **Responsive**: Diseño adaptable a móviles, tablets y desktop
- **Loading states**: Spinners durante carga de datos
- **Error handling**: Mensajes claros de error con toast
- **Confirmaciones**: Dialogs antes de acciones destructivas
- **Feedback visual**: Colores según estado (éxito/error/advertencia)
- **Accesibilidad**: Labels, ARIA attributes, navegación por teclado

## 📝 Tipos TypeScript

Todos los tipos están centralizados en `types/index.ts`:
- Usuario, Rol, Permisos
- Benefactor, TipoBenefactor, EstadoRegistro
- EstadoPago, Estadisticas, Cobro
- ApiResponse, PaginationInfo

## 🚦 Estado del Proyecto

### ✅ Completado
- [x] Autenticación JWT
- [x] Sistema de permisos dinámicos
- [x] Todos los módulos principales
- [x] Protección de rutas y acciones
- [x] Integración completa con API
- [x] UI/UX responsive

### 🔄 Sugerencias de Mejora Futuras
- [ ] Tests unitarios y de integración
- [ ] Modo oscuro
- [ ] Exportación de reportes PDF/Excel
- [ ] Gráficos y dashboards avanzados
- [ ] Filtros avanzados en listados
- [ ] Caché de datos con React Query
- [ ] PWA (Progressive Web App)

## 👥 Usuarios de Prueba

Para probar el sistema, use las credenciales proporcionadas por el backend. El sistema asignará permisos según el rol del usuario.

## 📞 Soporte

Para consultas o problemas, revisar:
1. Logs de consola del navegador
2. Network tab para ver requests/responses
3. Verificar que el backend esté corriendo
4. Verificar permisos del usuario

---

**Versión**: 1.0.0  
**Última actualización**: Enero 2026
