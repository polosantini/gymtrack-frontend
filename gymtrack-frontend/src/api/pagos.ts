import { pedir, qs, simular, USAR_MOCK } from './client'
import { notificacionesMock, pagosMock } from './mock/datos'
import type { NuevoPago, Notificacion, Pago } from './types'

export const pagosApi = {
  registrar: (datos: NuevoPago) =>
    USAR_MOCK
      ? simular<Pago>({ id: Date.now(), ...datos, estado: 'APROBADO', fecha: '2026-11-05' })
      : pedir<Pago>('/api/pagos', 'POST', datos),

  delMiembro: (miembroId?: number) =>
    USAR_MOCK
      ? simular(miembroId ? pagosMock.filter((p) => p.miembroId === miembroId) : pagosMock)
      : pedir<Pago[]>(`/api/pagos${qs({ miembroId })}`),
}

export const notificacionesApi = {
  delMiembro: (miembroId: number) =>
    USAR_MOCK
      ? simular(notificacionesMock.filter((n) => n.miembroId === miembroId))
      : pedir<Notificacion[]>(`/api/notificaciones${qs({ miembroId })}`),
}
