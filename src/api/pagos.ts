import { pedir, qs, simular, simularError, USAR_MOCK } from './client'
import { ahora, notificacionesMock, pagosMock } from './mock/datos'
import type { NuevoPago, Notificacion, Pago } from './types'

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
