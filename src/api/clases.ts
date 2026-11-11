import { pedir, qs, simular, simularError, USAR_MOCK } from './client'
import { clasesMock, fechaIso, miembrosMock, reservasMock, type ClaseGuardada, type ReservaGuardada } from './mock/datos'
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

// ---------- Reglas de reserva (copian ReservarClaseUseCase + Strategy del backend, solo para los mocks) ----------
/** Lunes de la semana de una fecha 'YYYY-MM-DD'. */
function lunesDe(fecha: string): string {
  const [a, m, d] = fecha.split('-').map(Number)
  const dia = new Date(a, m - 1, d)
  dia.setDate(dia.getDate() - ((dia.getDay() + 6) % 7))
  return fechaIso(dia)
}

function sumarDias(fecha: string, n: number): string {
  const [a, m, d] = fecha.split('-').map(Number)
  return fechaIso(new Date(a, m - 1, d + n))
}

/** Reservas que cuentan para la regla del plan (CONFIRMADA y EN_ESPERA) entre dos fechas. */
function activasDelMiembro(miembroId: number, desde: string, hasta: string): number {
  return reservasMock.filter(
    (r) => r.miembroId === miembroId && r.estado !== 'CANCELADA' && r.fecha >= desde && r.fecha <= hasta,
  ).length
}

/** Devuelve el mensaje de error del backend si la regla del plan se incumple, o null. */
function validarPlan(plan: string, miembroId: number, fecha: string): string | null {
  if (plan === 'BASICO') {
    const lunes = lunesDe(fecha)
    if (activasDelMiembro(miembroId, lunes, sumarDias(lunes, 6)) >= 2) return 'El plan BASICO permite máximo 2 reservas por semana'
  } else if (plan === 'FULL') {
    if (activasDelMiembro(miembroId, fecha, fecha) >= 1) return 'El plan FULL permite máximo 1 reservas por día'
  }
  return null // PREMIUM: ilimitado
}

export const reservasApi = {
  /** GET /api/reservas?miembroId= → reservas e historial, ordenadas por fecha descendente. */
  delMiembro: (miembroId: number) =>
    USAR_MOCK
      ? simular(
          reservasMock
            .filter((r) => r.miembroId === miembroId)
            .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id)
            .map(aReserva),
        )
      : pedir<Reserva[]>(`/api/reservas${qs({ miembroId })}`),

  /**
   * POST /api/reservas {miembroId, claseId, fecha} → 201 CONFIRMADA, o EN_ESPERA con posición.
   * Errores: 409 membresía inactiva, 404 clase, 400 fecha que no corresponde, 409 duplicada, 409 regla del plan.
   */
  reservar: (datos: NuevaReserva) => {
    if (!USAR_MOCK) return pedir<Reserva>('/api/reservas', 'POST', datos)

    // 1. Acceso (Clases → Miembros /acceso)
    const miembro = miembrosMock.find((m) => m.id === datos.miembroId)
    if (!miembro) return simularError(404, 'Miembro no encontrado')
    if (miembro.membresia?.estado !== 'ACTIVA') return simularError(409, 'La membresía no está activa')

    // 2. Clase y fecha
    const clase = clasesMock.find((c) => c.id === datos.claseId)
    if (!clase) return simularError(404, `Clase no encontrada con id: ${datos.claseId}`)
    if (!clase.dias.includes(diaDe(datos.fecha))) {
      return simularError(400, `La clase ${clase.nombre} no se dicta el ${datos.fecha}`)
    }

    // 3. Duplicada (una CANCELADA no cuenta)
    const deSesion = reservasMock.filter((r) => r.claseId === clase.id && r.fecha === datos.fecha && r.estado !== 'CANCELADA')
    if (deSesion.some((r) => r.miembroId === datos.miembroId)) {
      return simularError(409, `El miembro ${datos.miembroId} ya tiene una reserva para la clase ${clase.id} el ${datos.fecha}`)
    }

    // 4. Regla del plan (Strategy)
    const regla = validarPlan(miembro.membresia.plan, datos.miembroId, datos.fecha)
    if (regla) return simularError(409, regla)

    // 5. Aforo y lista de espera (si ya hay cola, una llegada nueva no se salta la espera)
    const confirmadas = deSesion.filter((r) => r.estado === 'CONFIRMADA').length
    const enEspera = deSesion.filter((r) => r.estado === 'EN_ESPERA')
    const confirmar = confirmadas < clase.aforo && enEspera.length === 0
    const ultimaPosicion = Math.max(0, ...reservasMock
      .filter((r) => r.claseId === clase.id && r.fecha === datos.fecha && r.posicionEspera != null)
      .map((r) => r.posicionEspera ?? 0))
    const nueva: ReservaGuardada = {
      id: Math.max(0, ...reservasMock.map((r) => r.id)) + 1,
      ...datos,
      estado: confirmar ? 'CONFIRMADA' : 'EN_ESPERA',
      posicionEspera: confirmar ? null : ultimaPosicion + 1,
      asistencia: null,
    }
    reservasMock.push(nueva) // se guarda en memoria hasta recargar la página
    return simular(aReserva(nueva))
  },

  /**
   * PATCH /api/reservas/{id}/cancelar → la reserva queda CANCELADA.
   * Las posiciones de los demás no se renumeran. Pasar el cupo al primero de la espera es Fase 3 (Observer).
   */
  cancelar: (id: number) => {
    if (!USAR_MOCK) return pedir<Reserva>(`/api/reservas/${id}/cancelar`, 'PATCH')
    const r = reservasMock.find((x) => x.id === id)
    if (!r) return simularError(404, `Reserva no encontrada con id: ${id}`)
    if (r.estado === 'CANCELADA') return simularError(409, `La reserva ${id} ya está cancelada`)
    r.estado = 'CANCELADA'
    r.posicionEspera = null
    return simular(aReserva(r))
  },

  /** PATCH /api/reservas/{id}/asistencia {asistio} → solo para reservas CONFIRMADA. */
  asistencia: (id: number, asistio: boolean) => {
    if (!USAR_MOCK) return pedir<Reserva>(`/api/reservas/${id}/asistencia`, 'PATCH', { asistio })
    const r = reservasMock.find((x) => x.id === id)
    if (!r) return simularError(404, `Reserva no encontrada con id: ${id}`)
    if (r.estado !== 'CONFIRMADA') {
      return simularError(409, `Solo se puede marcar asistencia en reservas CONFIRMADA. La reserva ${id} está ${r.estado}`)
    }
    r.asistencia = asistio
    return simular(aReserva(r))
  },
}
