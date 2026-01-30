// Tipos de usuario y autenticación
export interface Usuario {
  id_usuario: number;
  nombre_usuario: string;
  permisos: PermisosGranulares;
}

export interface PermisosGranulares {
  cartera_lectura: boolean;
  cartera_escritura: boolean;
  benefactores_lectura: boolean;
  benefactores_escritura: boolean;
  social_lectura: boolean;
  social_escritura: boolean;
  configuraciones: boolean;
  aprobaciones: boolean;
}

export interface LoginRequest {
  nombre_usuario: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    usuario: Usuario;
  };
}

export interface CambiarPasswordRequest {
  password_actual: string;
  password_nueva: string;
}

// Tipos de permisos (LEGACY - mantener por compatibilidad temporal)
export interface Permisos {
  [recurso: string]: {
    ver: boolean;
    editar: boolean;
  };
}

// LEGACY - Sistema antiguo de roles (mantener para servicios legacy)
export interface Rol {
  id_rol: number;
  nombre: string;
  descripcion?: string;
}

export interface MisPermisosResponse {
  success: boolean;
  data: {
    permisos: PermisosGranulares;
  };
}

export interface Recurso {
  id: string;
  nombre: string;
  descripcion: string;
}

// Tipos de benefactores
export type TipoBenefactor = 'TITULAR' | 'DEPENDIENTE';
export type EstadoRegistro = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
export type EstadoBenefactor = 'ACTIVO' | 'INACTIVO';
export type TipoAfiliacion = 'INDIVIDUAL' | 'FAMILIAR';

export interface Benefactor {
  id_benefactor: number;
  tipo_benefactor: TipoBenefactor;
  nombre_completo: string;
  cedula: string;
  email?: string;
  telefono?: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  fecha_nacimiento: string;
  fecha_suscripcion?: string;
  tipo_afiliacion?: TipoAfiliacion;
  n_convenio?: string;
  mes_prod?: string;
  num_cuenta_tc?: string;
  tipo_cuenta?: string;
  banco_emisor?: string;
  inscripcion: number;
  aporte: number;
  estado: EstadoBenefactor;
  estado_registro: EstadoRegistro;
  fecha_registro?: string;
  id_usuario?: number;
  id_titular?: number;
  titular?: {
    nombre_completo: string;
  };
}

export interface BenefactorCreateRequest {
  tipo_benefactor: TipoBenefactor;
  nombre_completo: string;
  cedula: string;
  email?: string;
  telefono?: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  fecha_nacimiento: string;
  fecha_suscripcion?: string;
  tipo_afiliacion?: TipoAfiliacion;
  inscripcion: number;
  aporte: number;
  estado: EstadoBenefactor;
}

export interface BenefactorUpdateRequest {
  nombre_completo?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  estado?: EstadoBenefactor;
}

export interface AsignarDependienteRequest {
  id_titular: number;
  id_dependiente: number;
}

// Tipos de aprobaciones
export type EstadoAprobacion = 'APROBADO' | 'RECHAZADO';

export interface Aprobacion {
  id_aprobacion: number;
  id_benefactor: number;
  id_usuario: number;
  estado_aprobacion: EstadoAprobacion;
  comentario?: string;
  fecha_aprobacion: string;
  benefactor?: Benefactor;
  usuario?: Usuario;
}

export interface AprobacionRequest {
  id_benefactor: number;
  estado_aprobacion: EstadoAprobacion;
  comentario?: string;
}

// Tipos de cobros y saldos
export type EstadoPagoType = 'APORTADO' | 'NO_APORTADO';

export interface EstadoPago {
  id_benefactor: number;
  nombre_completo: string;
  cedula: string;
  monto_esperado: string;
  monto_aportado: string;
  estado_aporte: EstadoPagoType;
  ultima_fecha_aporte?: string;
}

export interface Estadisticas {
  total_titulares: string;
  aportados: string;
  no_aportados: string;
  total_esperado: string;
  total_recaudado: string;
  porcentaje_recaudacion: string;
}

export interface Cobro {
  id_cobro: number;
  id_benefactor: number;
  fecha_transmision: string;
  fecha_pago: string;
  cod_tercero: string;
  estado: string;
  moneda: string;
  forma_pago: string;
  valor_cobrado: number;
  empresa: string;
  tipo_movimiento: string;
  pais: string;
  banco: string;
  tipo_cuenta: string;
  num_cuenta: string;
  observaciones?: string;
  fecha_registro?: string;
  benefactor?: Benefactor;
}

export interface CobroRequest {
  id_benefactor: number;
  fecha_transmision: string;
  fecha_pago: string;
  cod_tercero: string;
  estado: string;
  moneda: string;
  forma_pago: string;
  valor_cobrado: number;
  empresa: string;
  tipo_movimiento: string;
  pais: string;
  banco: string;
  tipo_cuenta: string;
  num_cuenta: string;
  observaciones?: string;
}

export interface RegistrarCobrosRequest {
  cobros: CobroRequest[];
}

export interface HistorialPago {
  mes: number;
  anio: number;
  monto_esperado: string;
  monto_aportado: string;
  estado_aporte: EstadoPagoType;
  ultima_fecha_aporte?: string;
}

export interface SaldoBenefactor {
  id_benefactor: number;
  nombre_completo: string;
  cedula: string;
  total_pagado: string;
  total_esperado: string;
  saldo_pendiente: string;
  meses_pagados: number;
  meses_pendientes: number;
}

// Tipos de respuesta genéricos
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: PaginationInfo;
  total?: number;
  mes?: number;
  anio?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
}
