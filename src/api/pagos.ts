import { pedir, qs, simular, simularError, USAR_MOCK } from './client'
import { agregarNotificacion, ahora, enDiferido, fechaIso, miembrosMock, notificacionesMock, pagosMock } from './mock/datos'
import type { NuevoPago, Notificacion, Pago, Periodo } from './types'

export const pagosApi = {
  /** POST /api/pagos {miembroId, plan, periodo, monto, metodo} → 201 con estado REGISTRADO. */
  registrar: (datos: NuevoPago) => {
    if (!USAR_MOCK) return pedir<Pago>('/api/pagos', 'POST', datos)
    if (!(datos.monto >= 0.01)) return simularError(400, 'El monto debe ser mayor a cero')
    const nuevo: Pago = {
      id: Math.max(0, ...pagosMock.map((p) => p.id)) + 1,
      ...datos,
      estado: 'REGISTRADO',
      fecha: ahora(),
    }
    pagosMock.push(nuevo) // se guarda en memoria hasta recargar la página
    // pago.registrado llega por RabbitMQ un momento después: Miembros activa y Notificaciones avisa
    enDiferido(() => {
      activarMembresia(nuevo)
      agregarNotificacion(nuevo.miembroId, 'CONFIRMACION_PAGO',
        `Pago registrado: plan ${nuevo.plan} por periodo ${nuevo.periodo} — $${nuevo.monto}`)
    })
    return simular(nuevo)
  },

  /** GET /api/pagos?miembroId= (el miembroId es obligatorio: no hay "listar todos"). */
  delMiembro: (miembroId: number) =>
    USAR_MOCK
      ? simular(pagosMock.filter((p) => p.miembroId === miembroId))
      : pedir<Pago[]>(`/api/pagos${qs({ miembroId })}`),
}

export const notificacionesApi = {
  /** GET /api/notificaciones?miembroId= → ordenadas por fecha descendente. */
  delMiembro: (miembroId: number) =>
    USAR_MOCK
      ? simular(notificacionesMock.filter((n) => n.miembroId === miembroId).sort((a, b) => b.fecha.localeCompare(a.fecha)))
      : pedir<Notificacion[]>(`/api/notificaciones${qs({ miembroId })}`),
}

// ---------- Consumidor de pago.registrado en Miembros (copia de PagoRegistradoListener, solo mocks) ----------
function sumarPeriodo(base: string, periodo: Periodo): string {
  const [a, m, d] = base.split('-').map(Number)
  const meses = periodo === 'MENSUAL' ? 1 : periodo === 'TRIMESTRAL' ? 3 : 12
  return fechaIso(new Date(a, m - 1 + meses, d))
}

function activarMembresia(pago: Pago): void {
  const membresia = miembrosMock.find((m) => m.id === pago.miembroId)?.membresia
  if (!membresia) return // sin membresía el backend descarta el evento: hay que crearla antes de pagar
  const hoy = fechaIso(new Date())
  const renovacion = membresia.estado === 'ACTIVA' && membresia.fechaVencimiento >= hoy
  const base = renovacion ? membresia.fechaVencimiento : hoy
  if (!renovacion) membresia.fechaInicio = hoy
  membresia.plan = pago.plan
  membresia.estado = 'ACTIVA'
  membresia.fechaVencimiento = sumarPeriodo(base, pago.periodo)
}
