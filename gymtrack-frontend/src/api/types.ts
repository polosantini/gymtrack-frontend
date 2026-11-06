// Tipos del contrato entre frontend y backend (sección "Contratos" de la ruta de trabajo).
// Si un campo cambia en el backend, se cambia aquí y en el documento el mismo día.

export type Plan = 'BASICO' | 'FULL' | 'PREMIUM'
export type Periodo = 'MENSUAL' | 'TRIMESTRAL' | 'ANUAL'
export type EstadoMembresia = 'ACTIVA' | 'VENCIDA' | 'SUSPENDIDA'
export type EstadoReserva = 'CONFIRMADA' | 'EN_ESPERA' | 'CANCELADA'
export type EstadoPago = 'APROBADO' | 'PENDIENTE' | 'RECHAZADO'
export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'PSE'
export type DiaSemana = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

// ---------- Miembros (8081) ----------
export interface Membresia {
  id: number
  plan: Plan
  estado: EstadoMembresia
  fechaInicio: string // 'YYYY-MM-DD'
  fechaVencimiento: string
}

export interface Miembro {
  id: number
  nombre: string
  documento: string
  correo: string
  telefono: string | null
  fechaRegistro: string
  membresia: Membresia | null
}

export interface NuevoMiembro {
  nombre: string
  documento: string
  correo: string
  telefono?: string
}

export interface PlanInfo {
  codigo: Plan
  nombre: string
  precios: Record<Periodo, number>
  beneficios: string[]
}

export interface Acceso {
  activa: boolean
  plan: Plan | null
}

// ---------- Clases y Reservas (8082) ----------
export interface Clase {
  id: number
  nombre: string
  instructor: string
  diasSemana: DiaSemana[]
  horaInicio: string // 'HH:mm'
  duracionMinutos: number
  aforoMaximo: number
  sala: string
  cuposLibres: number // para la fecha consultada
}

export type NuevaClase = Omit<Clase, 'id' | 'cuposLibres'>

export interface Reserva {
  id: number
  miembroId: number
  claseId: number
  claseNombre: string
  fecha: string
  horaInicio: string
  estado: EstadoReserva
  posicionEspera: number | null
  asistio: boolean | null
}

export interface NuevaReserva {
  miembroId: number
  claseId: number
  fecha: string
}

export interface ReservasDeSesion {
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
  metodo: MetodoPago
  estado: EstadoPago
  fecha: string
}

export type NuevoPago = Pick<Pago, 'miembroId' | 'plan' | 'periodo' | 'monto' | 'metodo'>

export interface Notificacion {
  id: number
  miembroId: number
  tipo: 'PAGO_CONFIRMADO' | 'MEMBRESIA_POR_VENCER' | 'CUPO_ASIGNADO'
  mensaje: string
  fecha: string
  leida: boolean
}
