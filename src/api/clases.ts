import { pedir, qs, simular, simularError, USAR_MOCK } from './client'
import { clasesMock, fechaIso, reservasMock, type ClaseGuardada, type ReservaGuardada } from './mock/datos'
import type { Clase, DiaSemana, NuevaClase, NuevaReserva, Reserva, ReservasDeSesion } from './types'

// ---------- Cálculos que en el backend hace ClaseServiceImpl (solo para los mocks) ----------
const DIA_JS: DiaSemana[] = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO']

function diaDe(fecha: string): DiaSemana {
  const [a, m, d] = fecha.split('-').map(Number)
  return DIA_JS[new Date(a, m - 1, d).getDay()]
}

/** Primera fecha >= desde en la que se dicta la clase. */
function proximaSesion(clase: ClaseGuardada, desde: string): string {
  const [a, m, d] = desde.split('-').map(Number)
  const dia = new Date(a, m - 1, d)
  for (let i = 0; i < 7; i++) {
    if (clase.dias.includes(DIA_JS[dia.getDay()])) return fechaIso(dia)
    dia.setDate(dia.getDate() + 1)
  }
  return desde
}

/** Cupos libres de una sesión = aforo − reservas CONFIRMADA de esa (clase, fecha). */
function cuposLibres(clase: ClaseGuardada, fecha: string): number {
  const confirmadas = reservasMock.filter((r) => r.claseId === clase.id && r.fecha === fecha && r.estado === 'CONFIRMADA').length
  return Math.max(0, clase.aforo - confirmadas)
}

function aRespuesta(clase: ClaseGuardada, fecha: string): Clase {
  return { ...clase, fecha, cuposLibres: cuposLibres(clase, fecha) }
}

function aReserva(r: ReservaGuardada): Reserva {
  const clase = clasesMock.find((c) => c.id === r.claseId)
  return { ...r, claseNombre: clase?.nombre ?? '', hora: clase?.hora ?? '' }
}

const hoy = () => fechaIso(new Date())

// ---------- Endpoints ----------
export const clasesApi = {
  /**
   * GET /api/clases[?fecha=YYYY-MM-DD]
   * Sin fecha: todas las clases, cada una con su próxima sesión y los cupos de esa sesión.
   * Con fecha: solo las clases que se dictan ese día, con los cupos de ese día.
   */
  listar: (fecha?: string) => {
    if (!USAR_MOCK) return pedir<Clase[]>(`/api/clases${qs({ fecha })}`)
    const desde = fecha ?? hoy()
    return simular(
      clasesMock
        .filter((c) => !fecha || c.dias.includes(diaDe(fecha)))
        .map((c) => aRespuesta(c, proximaSesion(c, desde))),
    )
  },

  /** GET /api/clases/{id} → 404 si no existe. */
  obtener: (id: number) => {
    if (!USAR_MOCK) return pedir<Clase>(`/api/clases/${id}`)
    const clase = clasesMock.find((c) => c.id === id)
    return clase ? simular(aRespuesta(clase, proximaSesion(clase, hoy()))) : simularError(404, `Clase no encontrada con id: ${id}`)
  },

  /** POST /api/clases {nombre, instructor, dias, hora, duracionMinutos, aforo, sala} → 201. */
  crear: (datos: NuevaClase) => {
    if (!USAR_MOCK) return pedir<Clase>('/api/clases', 'POST', datos)
    const nueva: ClaseGuardada = { id: Math.max(0, ...clasesMock.map((c) => c.id)) + 1, ...datos }
    clasesMock.push(nueva) // se guarda en memoria hasta recargar la página
    return simular(aRespuesta(nueva, proximaSesion(nueva, hoy())))
  },

  /** GET /api/clases/{id}/reservas?fecha= → confirmados y lista de espera ordenada por posición. */
  reservasDeSesion: (claseId: number, fecha: string) => {
    if (!USAR_MOCK) return pedir<ReservasDeSesion>(`/api/clases/${claseId}/reservas${qs({ fecha })}`)
    const clase = clasesMock.find((c) => c.id === claseId)
    if (!clase) return simularError(404, `Clase no encontrada con id: ${claseId}`)
    const deSesion = reservasMock.filter((r) => r.claseId === claseId && r.fecha === fecha).map(aReserva)
    return simular<ReservasDeSesion>({
      claseId, claseNombre: clase.nombre, fecha, hora: clase.hora, aforo: clase.aforo,
      cuposLibres: cuposLibres(clase, fecha),
      confirmados: deSesion.filter((r) => r.estado === 'CONFIRMADA'),
      enEspera: deSesion.filter((r) => r.estado === 'EN_ESPERA').sort((a, b) => (a.posicionEspera ?? 0) - (b.posicionEspera ?? 0)),
    })
  },
}

// Las reservas son Fase 2: estos mocks son básicos (sin reglas de plan ni validación de membresía).
export const reservasApi = {
  /** GET /api/reservas?miembroId= → reservas e historial de asistencia. */
  delMiembro: (miembroId: number) =>
    USAR_MOCK
      ? simular(reservasMock.filter((r) => r.miembroId === miembroId).map(aReserva))
      : pedir<Reserva[]>(`/api/reservas${qs({ miembroId })}`),

  /** POST /api/reservas {miembroId, claseId, fecha} → 201 CONFIRMADA o EN_ESPERA. */
  reservar: (datos: NuevaReserva) => {
    if (!USAR_MOCK) return pedir<Reserva>('/api/reservas', 'POST', datos)
    const clase = clasesMock.find((c) => c.id === datos.claseId)
    if (!clase) return simularError(404, `Clase no encontrada con id: ${datos.claseId}`)
    const activas = reservasMock.filter((r) => r.claseId === datos.claseId && r.fecha === datos.fecha && r.estado !== 'CANCELADA')
    if (activas.some((r) => r.miembroId === datos.miembroId)) {
      return simularError(409, `El miembro ${datos.miembroId} ya tiene una reserva para la clase ${datos.claseId} el ${datos.fecha}`)
    }
    const enEspera = activas.filter((r) => r.estado === 'EN_ESPERA').length
    const confirmar = cuposLibres(clase, datos.fecha) > 0 && enEspera === 0
    const nueva: ReservaGuardada = {
      id: Math.max(0, ...reservasMock.map((r) => r.id)) + 1, ...datos,
      estado: confirmar ? 'CONFIRMADA' : 'EN_ESPERA', posicionEspera: confirmar ? null : enEspera + 1, asistencia: null,
    }
    reservasMock.push(nueva)
    return simular(aReserva(nueva))
  },

  /** PATCH /api/reservas/{id}/cancelar */
  cancelar: (id: number) => {
    if (!USAR_MOCK) return pedir<Reserva>(`/api/reservas/${id}/cancelar`, 'PATCH')
    const r = reservasMock.find((x) => x.id === id)
    if (!r) return simularError(404, `Reserva no encontrada con id: ${id}`)
    r.estado = 'CANCELADA'
    r.posicionEspera = null
    return simular(aReserva(r))
  },

  /** PATCH /api/reservas/{id}/asistencia {asistio} */
  asistencia: (id: number, asistio: boolean) => {
    if (!USAR_MOCK) return pedir<Reserva>(`/api/reservas/${id}/asistencia`, 'PATCH', { asistio })
    const r = reservasMock.find((x) => x.id === id)
    if (!r) return simularError(404, `Reserva no encontrada con id: ${id}`)
    r.asistencia = asistio
    return simular(aReserva(r))
  },
}
