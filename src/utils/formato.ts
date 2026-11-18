import type { DiaSemana, EstadoMembresia, EstadoPago, EstadoReserva, Periodo, Plan } from '../api/types'

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

// ---------- Fechas (siempre 'YYYY-MM-DD' en hora local, como el backend) ----------
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function aFecha(iso: string): Date {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(a, m - 1, d)
}

function aIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function hoyIso(): string {
  return aIso(new Date())
}

export function sumarDiasIso(iso: string, n: number): string {
  const d = aFecha(iso)
  d.setDate(d.getDate() + n)
  return aIso(d)
}

/** Días desde hoy hasta la fecha (negativo si ya pasó). */
export function diasHasta(iso: string): number {
  return Math.round((aFecha(iso).getTime() - aFecha(hoyIso()).getTime()) / 86_400_000)
}

/** Día de la semana de JS (0 = domingo) → entrada de DIAS. */
function infoDia(iso: string) {
  return DIAS[(aFecha(iso).getDay() + 6) % 7]
}

/** '2026-11-17' → { corto: 'Mar', numero: 17 } */
export function diaCorto(iso: string) {
  return { corto: infoDia(iso).corto, numero: aFecha(iso).getDate() }
}

/** '2026-11-17' → 'martes 17 de noviembre' */
export function fechaLarga(iso: string): string {
  const d = aFecha(iso)
  return `${infoDia(iso).largo.toLowerCase()} ${d.getDate()} de ${MESES[d.getMonth()]}`
}

// ---------- Reservas y planes ----------
export const NOMBRE_ESTADO_RESERVA: Record<EstadoReserva, string> = {
  CONFIRMADA: 'Confirmada', EN_ESPERA: 'En espera', CANCELADA: 'Cancelada',
}

/** Regla de reserva de cada plan (Strategy del backend), en palabras. */
export const REGLA_PLAN: Record<Plan, string> = {
  BASICO: 'máximo 2 reservas por semana',
  FULL: 'máximo 1 reserva por día',
  PREMIUM: 'reservas ilimitadas',
}

/** 'Vence en 30 días', 'Vence hoy' o 'Venció hace 30 días'. */
export function textoVencimiento(iso: string): string {
  const n = diasHasta(iso)
  if (n > 0) return `Vence en ${n} ${n === 1 ? 'día' : 'días'}`
  if (n === 0) return 'Vence hoy'
  return `Venció hace ${-n} ${n === -1 ? 'día' : 'días'}`
}

/** '2026-11-17T20:30:15' → '17/11/2026 · 8:30 p. m.' */
export function fechaHora(iso: string): string {
  const horaMin = iso.slice(11, 16)
  return horaMin ? `${fecha(iso)} · ${hora(horaMin)}` : fecha(iso)
}
