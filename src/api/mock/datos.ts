// Datos simulados con el shape REAL de los endpoints del backend.
// Copian los data.sql de cada servicio (miembros, clases y pagos) para que la demo
// se vea igual con mocks que con el backend.
// Se usan mientras VITE_USAR_MOCK no sea 'false' (Fase 3, #36, conecta la API real).
import type { DiaSemana, Miembro, Notificacion, Pago, PlanInfo } from '../types'

/** Hoy + n días en formato 'YYYY-MM-DD' (el backend usa CURRENT_DATE + n). */
export function hoyMas(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return fechaIso(d)
}

export function fechaIso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Ahora en formato 'YYYY-MM-DDTHH:mm:ss' (LocalDateTime del backend). */
export function ahora(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${fechaIso(d)}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

// ---------- Miembros (miembros-service/data.sql) ----------
export const planesMock: PlanInfo[] = [
  { nombre: 'BASICO', precioMensual: 50000, precioTrimestral: 135000, precioAnual: 480000 },
  { nombre: 'FULL', precioMensual: 80000, precioTrimestral: 216000, precioAnual: 768000 },
  { nombre: 'PREMIUM', precioMensual: 120000, precioTrimestral: 324000, precioAnual: 1152000 },
]

export const miembrosMock: Miembro[] = [
  { id: 1, nombre: 'Ana', email: 'ana@test.com', fechaRegistro: ahora(),
    membresia: { id: 1, plan: 'BASICO', estado: 'SUSPENDIDA', fechaInicio: hoyMas(0), fechaVencimiento: hoyMas(30) } },
  { id: 2, nombre: 'Luis', email: 'luis@test.com', fechaRegistro: ahora(),
    membresia: { id: 2, plan: 'FULL', estado: 'ACTIVA', fechaInicio: hoyMas(0), fechaVencimiento: hoyMas(90) } },
  { id: 3, nombre: 'Sara', email: 'sara@test.com', fechaRegistro: ahora(),
    membresia: { id: 3, plan: 'PREMIUM', estado: 'SUSPENDIDA', fechaInicio: hoyMas(0), fechaVencimiento: hoyMas(365) } },
]

// ---------- Clases (clases-service/data.sql) ----------
// En la base la clase no guarda fecha ni cupos: se calculan al consultar (ver api/clases.ts).
export interface ClaseGuardada {
  id: number
  nombre: string
  instructor: string
  dias: DiaSemana[]
  hora: string
  duracionMinutos: number
  aforo: number
  sala: string
}

export const clasesMock: ClaseGuardada[] = [
  { id: 1, nombre: 'Spinning', instructor: 'Carlos Ruiz', dias: ['MARTES', 'JUEVES'], hora: '18:00', duracionMinutos: 45, aforo: 3, sala: 'Sala 1' },
  { id: 2, nombre: 'Yoga', instructor: 'Laura Gómez', dias: ['MARTES', 'JUEVES'], hora: '07:00', duracionMinutos: 60, aforo: 10, sala: 'Sala 2' },
  { id: 3, nombre: 'Funcional', instructor: 'Andrés Pérez', dias: ['LUNES', 'MIERCOLES', 'VIERNES'], hora: '19:00', duracionMinutos: 50, aforo: 15, sala: 'Sala 1' },
]

export interface ReservaGuardada {
  id: number
  miembroId: number
  claseId: number
  fecha: string
  estado: 'CONFIRMADA' | 'EN_ESPERA' | 'CANCELADA'
  posicionEspera: number | null
  asistencia: boolean | null
}

export const reservasMock: ReservaGuardada[] = [
  // Spinning el martes 17: aforo 3 lleno + 1 en espera
  { id: 1, miembroId: 1, claseId: 1, fecha: '2026-11-17', estado: 'CONFIRMADA', posicionEspera: null, asistencia: null },
  { id: 2, miembroId: 2, claseId: 1, fecha: '2026-11-17', estado: 'CONFIRMADA', posicionEspera: null, asistencia: null },
  { id: 3, miembroId: 3, claseId: 1, fecha: '2026-11-17', estado: 'CONFIRMADA', posicionEspera: null, asistencia: null },
  { id: 4, miembroId: 4, claseId: 1, fecha: '2026-11-17', estado: 'EN_ESPERA', posicionEspera: 1, asistencia: null },
  // Yoga el martes 17: 1 de 10 ocupado
  { id: 5, miembroId: 2, claseId: 2, fecha: '2026-11-17', estado: 'CONFIRMADA', posicionEspera: null, asistencia: null },
  // Historial de asistencia (Spinning del martes 10)
  { id: 6, miembroId: 1, claseId: 1, fecha: '2026-11-10', estado: 'CONFIRMADA', posicionEspera: null, asistencia: true },
  { id: 7, miembroId: 2, claseId: 1, fecha: '2026-11-10', estado: 'CONFIRMADA', posicionEspera: null, asistencia: false },
]

// ---------- Pagos y notificaciones (pagos-service/data.sql) ----------
export const pagosMock: Pago[] = [
  { id: 1, miembroId: 1, plan: 'BASICO', periodo: 'MENSUAL', monto: 50000, metodo: 'EFECTIVO', estado: 'REGISTRADO', fecha: ahora() },
  { id: 2, miembroId: 2, plan: 'FULL', periodo: 'TRIMESTRAL', monto: 216000, metodo: 'TARJETA', estado: 'REGISTRADO', fecha: ahora() },
  { id: 3, miembroId: 3, plan: 'PREMIUM', periodo: 'ANUAL', monto: 1152000, metodo: 'TRANSFERENCIA', estado: 'REGISTRADO', fecha: ahora() },
]

export const notificacionesMock: Notificacion[] = [
  { id: 1, miembroId: 1, tipo: 'CONFIRMACION_PAGO', mensaje: 'Pago registrado correctamente', fecha: ahora(), leida: false },
  { id: 2, miembroId: 2, tipo: 'VENCIMIENTO_PROXIMO', mensaje: 'Tu membresía vence en 7 días', fecha: ahora(), leida: false },
  { id: 3, miembroId: 3, tipo: 'CUPO_LIBERADO', mensaje: 'Se liberó un cupo en tu clase', fecha: ahora(), leida: true },
]
