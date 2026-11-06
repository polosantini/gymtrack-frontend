import { pedir, simular, USAR_MOCK } from './client'
import { miembrosMock, planesMock } from './mock/datos'
import type { Acceso, Membresia, Miembro, NuevoMiembro, Plan, PlanInfo } from './types'

export const miembrosApi = {
  listar: () => (USAR_MOCK ? simular(miembrosMock) : pedir<Miembro[]>('/api/miembros')),

  obtener: (id: number) =>
    USAR_MOCK ? simular(miembrosMock.find((m) => m.id === id)!) : pedir<Miembro>(`/api/miembros/${id}`),

  registrar: (datos: NuevoMiembro) =>
    USAR_MOCK
      ? simular<Miembro>({ id: Date.now(), ...datos, telefono: datos.telefono ?? null, fechaRegistro: '2026-11-05', membresia: null })
      : pedir<Miembro>('/api/miembros', 'POST', datos),

  crearMembresia: (miembroId: number, plan: Plan) =>
    USAR_MOCK
      ? simular<Membresia>({ id: Date.now(), plan, estado: 'SUSPENDIDA', fechaInicio: '2026-11-05', fechaVencimiento: '2026-11-05' })
      : pedir<Membresia>(`/api/miembros/${miembroId}/membresias`, 'POST', { plan }),

  acceso: (miembroId: number) => {
    if (!USAR_MOCK) return pedir<Acceso>(`/api/miembros/${miembroId}/acceso`)
    const m = miembrosMock.find((x) => x.id === miembroId)?.membresia
    return simular<Acceso>({ activa: m?.estado === 'ACTIVA', plan: m?.plan ?? null })
  },

  planes: () => (USAR_MOCK ? simular(planesMock) : pedir<PlanInfo[]>('/api/planes')),
}
