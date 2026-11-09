// Tipos del contrato entre frontend y backend.
// Fuente: contratos congelados en #8 + DTOs reales del backend (main) y la colección Postman.
// Si un campo cambia en el backend, se cambia aquí y se anota en el hilo de #8 el mismo día.
//
// Formatos: fecha 'YYYY-MM-DD' · fecha y hora 'YYYY-MM-DDTHH:mm:ss' · hora 'HH:mm'

export type Plan = 'BASICO' | 'FULL' | 'PREMIUM'
export type Periodo = 'MENSUAL' | 'TRIMESTRAL' | 'ANUAL'
export type EstadoMembresia = 'SUSPENDIDA' | 'ACTIVA' | 'VENCIDA'
export type EstadoReserva = 'CONFIRMADA' | 'EN_ESPERA' | 'CANCELADA'
export type EstadoPago = 'REGISTRADO' | 'PENDIENTE' | 'COMPLETADO' | 'FALLIDO'
export type DiaSemana = 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO' | 'DOMINGO'
export type TipoNotificacion = 'CONFIRMACION_PAGO' | 'VENCIMIENTO_PROXIMO' | 'CUPO_LIBERADO'

/** Formato uniforme de error de los tres servicios. */
export interface ErrorApi {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
}

// ---------- Miembros y Membresías (8081) ----------
export interface Membresia {
  id: number
  plan: Plan
  estado: EstadoMembresia
  fechaInicio: string // fecha
  fechaVencimiento: string // fecha
}

/** GET /api/miembros, GET /api/miembros/{id}, respuesta de POST /api/miembros */
export interface Miembro {
  id: number
  nombre: string
  email: string
  fechaRegistro: string // fecha y hora
  membresia: Membresia | null
}

/** POST /api/miembros */
export interface NuevoMiembro {
  nombre: string
  email: string
}

/** GET /api/planes */
export interface PlanInfo {
  nombre: Plan
  precioMensual: number
  precioTrimestral: number
  precioAnual: number
}

/** GET /api/miembros/{id}/acceso */
export interface Acceso {
  activa: boolean
  plan: Plan | null
}

// ---------- Clases y Reservas (8082) ----------
/** GET /api/clases (cuposLibres corresponde a la sesión de `fecha`) */
export interface Clase {
  id: number
  nombre: string
  instructor: string
  dias: DiaSemana[]
  hora: string // 'HH:mm'
  duracionMinutos: number
  aforo: number
  sala: string
  fecha: string // próxima sesión (o la fecha consultada)
  cuposLibres: number
}

/** POST /api/clases */
export type NuevaClase = Omit<Clase, 'id' | 'fecha' | 'cuposLibres'>

export interface Reserva {
  id: number
  miembroId: number
  claseId: number
  claseNombre: string
  fecha: string
  hora: string
  estado: EstadoReserva
  posicionEspera: number | null
  asistencia: boolean | null
}

/** POST /api/reservas */
export interface NuevaReserva {
  miembroId: number
  claseId: number
  fecha: string
}

/** GET /api/clases/{id}/reservas?fecha= */
export interface ReservasDeSesion {
  claseId: number
  claseNombre: string
  fecha: string
  hora: string
  aforo: number
  cuposLibres: number
  confirmados: Reserva[]
  enEspera: Reserva[]
}

// ---------- Pagos y Notificaciones (8083) ----------
export interface Pago {
  id: number
  miembroId: number
  plan: Plan
  periodo: Periodo
  monto: number
  metodo: string // libre según #8
  estado: EstadoPago
  fecha: string // fecha y hora
}

/** POST /api/pagos */
export type NuevoPago = Pick<Pago, 'miembroId' | 'plan' | 'periodo' | 'monto' | 'metodo'>

export interface Notificacion {
  id: number
  miembroId: number
  tipo: TipoNotificacion
  mensaje: string
  fecha: string // fecha y hora
  leida: boolean
}
