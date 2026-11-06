// Datos simulados que siguen exactamente los tipos del contrato.
// Se usan mientras el backend no esté listo (VITE_USAR_MOCK=true en el .env).
import type { Clase, Miembro, Notificacion, Pago, PlanInfo, Reserva } from '../types'

export const planesMock: PlanInfo[] = [
  { codigo: 'BASICO', nombre: 'Básico', precios: { MENSUAL: 90000, TRIMESTRAL: 256500, ANUAL: 918000 }, beneficios: ['Zona de pesas y cardio', '2 clases por semana'] },
  { codigo: 'FULL', nombre: 'Full', precios: { MENSUAL: 140000, TRIMESTRAL: 399000, ANUAL: 1428000 }, beneficios: ['Acceso total', '1 clase por día'] },
  { codigo: 'PREMIUM', nombre: 'Premium', precios: { MENSUAL: 200000, TRIMESTRAL: 570000, ANUAL: 2040000 }, beneficios: ['Acceso 24/7', 'Clases ilimitadas'] },
]

export const miembrosMock: Miembro[] = [
  { id: 1, nombre: 'Ana Martínez', documento: '1010101010', correo: 'ana@gymtrack.co', telefono: '3001112233', fechaRegistro: '2026-06-01',
    membresia: { id: 1, plan: 'PREMIUM', estado: 'ACTIVA', fechaInicio: '2026-10-01', fechaVencimiento: '2027-01-01' } },
  { id: 2, nombre: 'Carlos Pérez', documento: '1020202020', correo: 'carlos@gymtrack.co', telefono: null, fechaRegistro: '2026-07-15',
    membresia: { id: 2, plan: 'BASICO', estado: 'ACTIVA', fechaInicio: '2026-10-20', fechaVencimiento: '2026-11-20' } },
  { id: 3, nombre: 'Sofía Torres', documento: '1030303030', correo: 'sofia@gymtrack.co', telefono: '3005556677', fechaRegistro: '2026-09-02',
    membresia: { id: 3, plan: 'FULL', estado: 'VENCIDA', fechaInicio: '2026-09-02', fechaVencimiento: '2026-10-02' } },
  { id: 4, nombre: 'Diego Ramírez', documento: '1040404040', correo: 'diego@gymtrack.co', telefono: null, fechaRegistro: '2026-11-01', membresia: null },
]

export const clasesMock: Clase[] = [
  { id: 1, nombre: 'Spinning Amanecer', instructor: 'Lucía Gómez', diasSemana: ['MONDAY', 'WEDNESDAY', 'FRIDAY'], horaInicio: '06:00', duracionMinutos: 50, aforoMaximo: 12, sala: 'Sala Ciclo', cuposLibres: 5 },
  { id: 2, nombre: 'Yoga Flow', instructor: 'Andrés Rojas', diasSemana: ['TUESDAY', 'THURSDAY'], horaInicio: '07:00', duracionMinutos: 60, aforoMaximo: 15, sala: 'Sala Zen', cuposLibres: 9 },
  { id: 3, nombre: 'Spinning Nocturno', instructor: 'Andrés Rojas', diasSemana: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'], horaInicio: '20:00', duracionMinutos: 45, aforoMaximo: 3, sala: 'Sala Ciclo', cuposLibres: 0 },
]

export const reservasMock: Reserva[] = [
  { id: 1, miembroId: 1, claseId: 3, claseNombre: 'Spinning Nocturno', fecha: '2026-11-10', horaInicio: '20:00', estado: 'CONFIRMADA', posicionEspera: null, asistio: null },
  { id: 2, miembroId: 2, claseId: 3, claseNombre: 'Spinning Nocturno', fecha: '2026-11-10', horaInicio: '20:00', estado: 'EN_ESPERA', posicionEspera: 1, asistio: null },
  { id: 3, miembroId: 1, claseId: 2, claseNombre: 'Yoga Flow', fecha: '2026-11-03', horaInicio: '07:00', estado: 'CONFIRMADA', posicionEspera: null, asistio: true },
]

export const pagosMock: Pago[] = [
  { id: 1, miembroId: 1, plan: 'PREMIUM', periodo: 'TRIMESTRAL', monto: 570000, metodo: 'TARJETA', estado: 'APROBADO', fecha: '2026-10-01' },
  { id: 2, miembroId: 2, plan: 'BASICO', periodo: 'MENSUAL', monto: 90000, metodo: 'EFECTIVO', estado: 'APROBADO', fecha: '2026-10-20' },
]

export const notificacionesMock: Notificacion[] = [
  { id: 1, miembroId: 1, tipo: 'PAGO_CONFIRMADO', mensaje: 'Recibimos tu pago de $570.000. Tu membresía Premium está activa.', fecha: '2026-10-01', leida: true },
  { id: 2, miembroId: 2, tipo: 'MEMBRESIA_POR_VENCER', mensaje: 'Tu membresía Básico vence el 20 de noviembre.', fecha: '2026-11-13', leida: false },
]
