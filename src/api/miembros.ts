import { pedir, simular, simularError, USAR_MOCK } from './client'
import { ahora, hoyMas, miembrosMock, planesMock } from './mock/datos'
import type { Acceso, Membresia, Miembro, NuevoMiembro, Plan, PlanInfo } from './types'

export const miembrosApi = {
  /** GET /api/miembros → lista con la membresía actual de cada uno. */
  listar: () => (USAR_MOCK ? simular(miembrosMock) : pedir<Miembro[]>('/api/miembros')),

  /** GET /api/miembros/{id} → 404 si no existe. */
  obtener: (id: number) => {
    if (!USAR_MOCK) return pedir<Miembro>(`/api/miembros/${id}`)
    const miembro = miembrosMock.find((m) => m.id === id)
    return miembro ? simular(miembro) : simularError(404, `Miembro no encontrado con id: ${id}`)
  },

  /** POST /api/miembros {nombre, email} → 201 con el miembro, o 409 si el email ya existe. */
  registrar: (datos: NuevoMiembro) => {
    if (!USAR_MOCK) return pedir<Miembro>('/api/miembros', 'POST', datos)
    if (miembrosMock.some((m) => m.email.toLowerCase() === datos.email.toLowerCase())) {
      return simularError(409, `Ya existe un miembro con el email ${datos.email}`)
    }
    const nuevo: Miembro = {
      id: Math.max(0, ...miembrosMock.map((m) => m.id)) + 1,
      nombre: datos.nombre,
      email: datos.email,
      fechaRegistro: ahora(),
      membresia: null,
    }
    miembrosMock.push(nuevo) // se guarda en memoria hasta recargar la página
    return simular(nuevo)
  },

  /** POST /api/miembros/{id}/membresias {plan} → 201, nace SUSPENDIDA hasta el primer pago. */
  crearMembresia: (miembroId: number, plan: Plan) => {
    if (!USAR_MOCK) return pedir<Membresia>(`/api/miembros/${miembroId}/membresias`, 'POST', { plan })
    const miembro = miembrosMock.find((m) => m.id === miembroId)
    if (!miembro) return simularError(404, `Miembro no encontrado con id: ${miembroId}`)
    const membresia: Membresia = { id: Date.now(), plan, estado: 'SUSPENDIDA', fechaInicio: hoyMas(0), fechaVencimiento: hoyMas(30) }
    miembro.membresia = membresia
    return simular(membresia)
  },

  /** GET /api/miembros/{id}/acceso → {activa, plan}. */
  acceso: (miembroId: number) => {
    if (!USAR_MOCK) return pedir<Acceso>(`/api/miembros/${miembroId}/acceso`)
    const miembro = miembrosMock.find((m) => m.id === miembroId)
    if (!miembro) return simularError(404, `Miembro no encontrado con id: ${miembroId}`)
    const m = miembro.membresia
    return simular<Acceso>({ activa: m?.estado === 'ACTIVA', plan: m?.plan ?? null })
  },

  /** GET /api/planes → [{nombre, precioMensual, precioTrimestral, precioAnual}]. */
  planes: () => (USAR_MOCK ? simular(planesMock) : pedir<PlanInfo[]>('/api/planes')),
}
