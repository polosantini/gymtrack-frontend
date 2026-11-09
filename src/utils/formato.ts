import type { DiaSemana, EstadoMembresia, EstadoPago, Periodo, Plan } from '../api/types'

export const NOMBRE_PLAN: Record<Plan, string> = { BASICO: 'Básico', FULL: 'Full', PREMIUM: 'Premium' }
export const NOMBRE_PERIODO: Record<Periodo, string> = { MENSUAL: 'Mensual', TRIMESTRAL: 'Trimestral', ANUAL: 'Anual' }
export const NOMBRE_ESTADO_MEMBRESIA: Record<EstadoMembresia, string> = {
  ACTIVA: 'Activa', VENCIDA: 'Vencida', SUSPENDIDA: 'Suspendida',
}
export const NOMBRE_ESTADO_PAGO: Record<EstadoPago, string> = {
  REGISTRADO: 'Registrado', PENDIENTE: 'Pendiente', COMPLETADO: 'Completado', FALLIDO: 'Fallido',
}

/** El método de pago es texto libre en el backend; estas son las opciones que ofrece el formulario. */
export const METODOS_PAGO = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'] as const

/** 'TRANSFERENCIA' → 'Transferencia' (sirve para cualquier texto que venga del backend). */
export function nombreMetodo(metodo: string): string {
  const t = metodo.trim().toLowerCase()
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export const DIAS: { valor: DiaSemana; corto: string; largo: string }[] = [
  { valor: 'LUNES', corto: 'Lun', largo: 'Lunes' },
  { valor: 'MARTES', corto: 'Mar', largo: 'Martes' },
  { valor: 'MIERCOLES', corto: 'Mié', largo: 'Miércoles' },
  { valor: 'JUEVES', corto: 'Jue', largo: 'Jueves' },
  { valor: 'VIERNES', corto: 'Vie', largo: 'Viernes' },
  { valor: 'SABADO', corto: 'Sáb', largo: 'Sábado' },
  { valor: 'DOMINGO', corto: 'Dom', largo: 'Domingo' },
]

/** '2026-11-20' o '2026-11-20T10:30:00' → '20/11/2026' */
export function fecha(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${a}`
}

/** '18:00' → '6:00 p. m.' */
export function hora(valor: string): string {
  const [h, m] = valor.split(':').map(Number)
  const sufijo = h >= 12 ? 'p. m.' : 'a. m.'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${sufijo}`
}

export function pesos(valor: number): string {
  return `$${valor.toLocaleString('es-CO')}`
}

export function iniciales(nombre: string): string {
  return nombre.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

export function mensajeDe(e: unknown): string {
  return e instanceof Error ? e.message : 'Ocurrió un error inesperado'
}
