import { pedir, qs, simular, simularError, USAR_MOCK } from './client'
import { agregarNotificacion, ahora, enDiferido, hoyMas, miembrosMock, planesMock } from './mock/datos'
import type { Acceso, Membresia, Miembro, NuevoMiembro, Plan, PlanInfo } from './types'

/** Miembros ya avisados hoy de su vencimiento (en el backend: notificadoVencimientoEl). */
const notificadosHoy = new Map<number, string>()

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
    return simular<Acceso>({ activa: m?.estado === 'ACTIVA' && m.fechaVencimiento >= hoyMas(0), plan: m?.plan ?? null })
  },

  /**
   * POST /api/membresias/procesar-vencimientos[?ventanaDias=] → dispara a mano la tarea diaria (#32).
   * Publica membresia.proxima.vencer por cada membresía ACTIVA que vence dentro de la ventana (7 días por defecto)
   * y que no se haya notificado hoy. Notificaciones crea la alerta VENCIMIENTO_PROXIMO.
   */
  procesarVencimientos: (ventanaDias?: number) => {
    if (!USAR_MOCK) {
      return pedir<{ eventosPublicados: number; ventanaDias: number | string }>(
        `/api/membresias/procesar-vencimientos${qs({ ventanaDias })}`, 'POST')
    }
    const dias = ventanaDias ?? 7
    const hoy = hoyMas(0)
    const hasta = hoyMas(dias)
    let publicados = 0
    for (const m of miembrosMock) {
      const mem = m.membresia
      if (!mem || mem.estado !== 'ACTIVA' || mem.fechaVencimiento < hoy || mem.fechaVencimiento > hasta) continue
      if (notificadosHoy.get(m.id) === hoy) continue // no repetir la alerta el mismo día
      notificadosHoy.set(m.id, hoy)
      publicados++
      const [a, mes, d] = mem.fechaVencimiento.split('-').map(Number)
      const [ah, mh, dh] = hoy.split('-').map(Number)
      const restantes = Math.round((new Date(a, mes - 1, d).getTime() - new Date(ah, mh - 1, dh).getTime()) / 86_400_000)
      const fechaVenc = mem.fechaVencimiento
      enDiferido(() => agregarNotificacion(m.id, 'VENCIMIENTO_PROXIMO', `Tu membresía vence en ${restantes} día(s) (${fechaVenc})`))
    }
    return simular({ eventosPublicados: publicados, ventanaDias: ventanaDias ?? 'default' })
  },

  /** GET /api/planes → [{nombre, precioMensual, precioTrimestral, precioAnual}]. */
  planes: () => (USAR_MOCK ? simular(planesMock) : pedir<PlanInfo[]>('/api/planes')),
}
