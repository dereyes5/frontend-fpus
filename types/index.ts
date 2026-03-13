// Tipos de usuario y autenticación
export interface Usuario {
  id_usuario: number;
  nombre_usuario: string;
  cargo?: string;
  activo?: boolean;
  fecha_inactivacion?: string | null;
  permisos: PermisosGranulares;
}

export interface PermisosGranulares {
  cartera_lectura: boolean;
  cartera_escritura: boolean;
  benefactores_ingresar: boolean;
  benefactores_administrar: boolean;
  social_ingresar: boolean;
  social_administrar: boolean;
  configuraciones: boolean;
  aprobaciones: boolean;
  aprobaciones_social: boolean;
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
export type TipoAfiliacion = 'individual' | 'corporativo';

export interface Benefactor {
  id_benefactor: number;
  tipo_benefactor: TipoBenefactor;
  nombre_completo: string;
  cedula: string;
  nacionalidad?: string;
  estado_civil?: string;
  email?: string;
  telefono?: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  fecha_nacimiento: string;
  fecha_suscripcion?: string;
  tipo_afiliacion?: TipoAfiliacion;
  corporacion?: string;
  cuenta?: string;
  n_convenio?: string;
  mes_prod?: string;
  num_cuenta_tc?: string;
  tipo_cuenta?: string;
  banco_emisor?: string;
  inscripcion: number;
  aporte: number;
  observacion?: string;
  estado: EstadoBenefactor;
  estado_registro: EstadoRegistro;
  id_usuario?: number;
  nombre_usuario_carga?: string;
  ejecutivo?: string;
  id_titular?: number;
  titular?: {
    nombre_completo: string;
  };
}

export interface BenefactorCreateRequest {
  tipo_benefactor: TipoBenefactor;
  nombre_completo: string;
  cedula: string;
  nacionalidad?: string;
  estado_civil?: string;
  email?: string;
  telefono?: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  fecha_nacimiento?: string;
  fecha_suscripcion?: string;
  tipo_afiliacion?: TipoAfiliacion;
  corporacion?: string;
  cuenta?: string;
  n_convenio?: string;
  mes_prod?: string;
  num_cuenta_tc?: string;
  tipo_cuenta?: string;
  banco_emisor?: string;
  inscripcion: number;
  aporte: number;
  observacion?: string;
  estado: EstadoBenefactor;
}

export interface BenefactorUpdateRequest {
  tipo_afiliacion?: TipoAfiliacion;
  corporacion?: string;
  nombre_completo?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  nacionalidad?: string;
  estado_civil?: string;
  observacion?: string;
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
export type EstadoCobroType = 'APORTADO' | 'NO_APORTADO';

export interface EstadoPago {
  id_benefactor: number;
  nombre_completo: string;
  cedula: string;
  n_convenio?: string;
  corporacion?: string | null;
  monto_esperado: string;
  monto_aportado: string;
  estado_aporte: EstadoPagoType;
  estado_cobro?: EstadoCobroType;
  cobros_debitados?: number;
  cobros_pendientes?: number;
  cobros_errores?: number;
  ultima_fecha_aporte?: string;
}

export interface Estadisticas {
  total_titulares: string;
  total_benefactores: string;
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
  anio: number;
  mes: number;
  periodo: string;
  monto_esperado: string;
  monto_aportado: string;
  aportes_exitosos: number;
  aportes_fallidos: number;
  ultima_fecha_aporte: string | null;
  estado_aporte: EstadoPagoType;
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

// ========================================
// TIPOS PARA DÉBITOS MENSUALES
// ========================================

export type EstadoAporteMensual = 'APORTADO' | 'NO_APORTADO';

export interface LoteImportacion {
  id_lote: number;
  nombre_archivo: string;
  hash_archivo: string;
  mes_proceso: number;
  anio_proceso: number;
  total_registros: number;
  registros_exitosos: number;
  registros_fallidos: number;
  id_usuario_carga: number;
  nombre_usuario?: string;
  fecha_importacion: string;
  observaciones?: string;
  total_cobros?: number;
}

export interface EstadoAporteMensualBenefactor {
  id_estado: number;
  id_benefactor: number;
  nombre_completo: string;
  cedula: string;
  email: string;
  telefono: string;
  tipo_benefactor: TipoBenefactor;
  n_convenio: string;
  estado_aporte: EstadoAporteMensual;
  share_inscripcion: string;
  es_titular: boolean;
  id_titular_relacionado?: number;
  nombre_titular?: string;
  mes: number;
  anio: number;
  fecha_registro: string;
  archivo_origen?: string;
  fecha_importacion?: string;
}

export interface HistorialAporteMensual {
  id_estado: number;
  mes: number;
  anio: number;
  periodo: string;
  id_benefactor: number;
  nombre_completo: string;
  cedula: string;
  tipo_benefactor: TipoBenefactor;
  n_convenio: string;
  estado_aporte: EstadoAporteMensual;
  share_inscripcion: string;
  es_titular: boolean;
  id_titular_relacionado?: number;
  nombre_titular?: string;
  // Datos del cobro bancario (solo para titulares)
  cod_tercero?: string;
  estado_banco_raw?: string;
  fecha_transmision?: string;
  fecha_pago?: string;
  valor_cobrado?: string;
  banco?: string;
  tipo_cuenta?: string;
  num_cuenta?: string;
  forma_pago?: string;
  // Datos del lote
  nombre_archivo?: string;
  fecha_importacion?: string;
  fecha_registro: string;
  observaciones?: string;
}

export interface DetalleCobroLote {
  id_cobro: number;
  id_benefactor: number;
  nombre_completo: string;
  cedula: string;
  n_convenio: string;
  cod_tercero: string;
  estado_banco_raw: string;
  valor_cobrado: string;
  fecha_transmision: string;
  fecha_pago: string;
  banco: string;
  tipo_cuenta: string;
  num_cuenta: string;
  fila_excel: number;
}

export interface DetalleLote {
  lote: LoteImportacion;
  cobros: DetalleCobroLote[];
  estados: EstadoAporteMensualBenefactor[];
}

export interface ResultadoImportacion {
  success: boolean;
  lote: {
    id_lote: number;
    nombre_archivo: string;
    mes: number;
    anio: number;
    total_registros: number;
    insertados_exitosos: number;
    insertados_fallidos: number;
  };
  procesamiento: {
    total_procesados: number;
    titulares_aportados: number;
    titulares_no_aportados: number;
    dependientes_actualizados: number;
    errores: number;
  };
  errores?: Array<{
    fila: number;
    cod_tercero: string;
    error: string;
  }>;
}

// ==========================================
// MÓDULO SOCIAL
// ==========================================

export interface BeneficiarioSocial {
  id_beneficiario_social: number;
  nombre_completo: string;
  nombres?: string;
  apellidos?: string;
  sexo?: 'M' | 'F';
  edad?: number;
  cedula?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  pais?: string;
  nacionalidad?: string;
  estado_civil?: string;
  tipo_sangre?: string;
  fecha_nacimiento?: string;
  referencia?: string;
  discapacidad?: boolean;
  discapacidad_detalle?: string;
  con_quien_vive?: string;
  con_quien_vive_detalle?: string;
  situacion_vivienda?: Record<string, any>;
  salud_estado_general?: string;
  enfermedad_catastrofica?: boolean;
  toma_medicacion_constante?: boolean;
  alergia_medicamentos?: boolean;
  alergia_medicamentos_detalle?: string;
  nutricion_num_comidas?: number;
  nutricion_desayuno?: boolean;
  nutricion_almuerzo?: boolean;
  nutricion_merienda?: boolean;
  nutricion_consume_frutas?: boolean;
  recursos_economicos?: Record<string, any>;
  red_social_apoyo?: Record<string, any>;
  latitud?: number;
  longitud?: number;
  se_siente_acompanado?: boolean | null;
  perdida_familiar_reciente?: boolean | null;
  perdida_familiar_detalle?: string;
  observaciones_conclusiones?: string;
  fecha_generacion_ficha?: string;
  ficha_pdf_nombre?: string;
  ficha_pdf_ruta?: string;
  firma_nombre?: string;
  firma_ruta?: string;
  relaciones_familiares?: Array<{
    id_relacion_familiar?: number;
    orden: number;
    nombre_familiar: string;
    forma_convivencia: 'OCASIONAL' | 'PERMANENTE';
    edad?: number;
    cedula?: string;
    telefono?: string;
  }>;
  tipo_caso: 'Apoyo alimentario' | 'Apoyo médico' | 'Vivienda' | 'Educación' | 'Apoyo psicológico' | 'Otro';
  prioridad: 'Alta' | 'Media' | 'Baja';
  estado: 'Activo' | 'En seguimiento' | 'Cerrado';
  descripcion_caso: string;
  id_usuario_carga: number;
  fecha_inicio: string;
  fecha_cierre?: string;
  estado_registro: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  observaciones?: string;
  fecha_registro: string;
  fecha_actualizacion: string;
  // Campos adicionales de la vista
  nombre_usuario_carga?: string;
  total_seguimientos?: number;
  total_fotos?: number;
  ultima_actividad?: string;
}

export interface SeguimientoSocial {
  id_seguimiento: number;
  id_beneficiario_social: number;
  tipo_evento: 'Visita domiciliaria' | 'Entrega de apoyo' | 'Llamada telefónica' | 'Coordinación externa' | 'Actualización de caso' | 'Cierre de caso' | 'Otro';
  descripcion: string;
  id_usuario: number;
  fecha_evento: string;
  tiene_fotos: boolean;
  fecha_registro: string;
  responsable?: string;
  email_responsable?: string;
  fotos?: FotoSeguimiento[];
}

export interface FotoSeguimiento {
  id_foto: number;
  id_seguimiento: number;
  nombre_archivo: string;
  ruta_archivo: string;
  descripcion?: string;
  fecha_carga: string;
}

export interface EstadisticasSocial {
  general: {
    casos_activos: number;
    casos_en_seguimiento: number;
    casos_cerrados: number;
    prioridad_alta: number;
    prioridad_media: number;
    prioridad_baja: number;
    pendientes_aprobacion: number;
    aprobados: number;
    rechazados: number;
    tipos_caso_unicos: number;
    ciudades_atendidas: number;
  };
  por_tipo_caso: Array<{
    tipo_caso: string;
    total: number;
  }>;
}

export interface CasoSocialPendiente extends BeneficiarioSocial {
  // Hereda todos los campos de BeneficiarioSocial
}

export interface AprobacionSocial {
  id_aprobacion: number;
  id_beneficiario_social: number;
  id_admin: number;
  estado_aprobacion: 'APROBADO' | 'RECHAZADO';
  comentario?: string;
  fecha_accion: string;
}

// ==========================================
// NOTIFICACIONES
// ==========================================

export interface Notificacion {
  id_notificacion: number;
  id_usuario: number;
  tipo: 'APROBACION_BENEFACTOR' | 'APROBACION_SOCIAL' | 'CUMPLEAÑOS' | 'SISTEMA';
  titulo: string;
  mensaje: string;
  link?: string;
  leida: boolean;
  fecha_creacion: string;
  fecha_lectura?: string;
}

export interface EstadisticasNotificaciones {
  total: number;
  no_leidas: number;
  leidas: number;
  aprobaciones_benefactor: number;
  aprobaciones_social: number;
  cumpleanos: number;
  sistema: number;
}
