import { pedir, qs, simular, USAR_MOCK } from './client'
import { clasesMock, reservasMock } from './mock/datos'
import type { Clase, NuevaClase, NuevaReserva, Reserva, ReservasDeSesion } from './types'

export const clasesApi = {
  /** Catálogo con los cupos libres para la fecha indicada (YYYY-MM-DD). */
  listar: (fecha?: string) => (USAR_MOCK ? simular(clasesMock) : pedir<Clase[]>(`/api/clases${qs({ fecha })}`)),

  crear: (datos: NuevaClase) =>
    USAR_MOCK
      ? simular<Clase>({ id: Date.now(), ...datos, cuposLibres: datos.aforoMaximo })
      : pedir<Clase>('/api/clases', 'POST', datos),

  reservasDeSesion: (claseId: number, fecha: string) => {
    if (!USAR_MOCK) return pedir<ReservasDeSesion>(`/api/clases/${claseId}/reservas${qs({ fecha })}`)
    const deSesion = reservasMock.filter((r) => r.claseId === claseId && r.fecha === fecha)
    return simular<ReservasDeSesion>({
      confirmados: deSesion.filter((r) => r.estado === 'CONFIRMADA'),
      enEspera: deSesion.filter((r) => r.estado === 'EN_ESPERA'),
    })
  },
}

export const reservasApi = {
  delMiembro: (miembroId: number) =>
    USAR_MOCK
      ? simular(reservasMock.filter((r) => r.miembroId === miembroId))
      : pedir<Reserva[]>(`/api/reservas${qs({ miembroId })}`),

  reservar: (datos: NuevaReserva) => {
    if (!USAR_MOCK) return pedir<Reserva>('/api/reservas', 'POST', datos)
    const clase = clasesMock.find((c) => c.id === datos.claseId)!
    const llena = clase.cuposLibres === 0
    return simular<Reserva>({
      id: Date.now(), ...datos, claseNombre: clase.nombre, horaInicio: clase.horaInicio,
      estado: llena ? 'EN_ESPERA' : 'CONFIRMADA', posicionEspera: llena ? 2 : null, asistio: null,
    })
  },

  cancelar: (id: number) =>
    USAR_MOCK
      ? simular<Reserva>({ ...reservasMock.find((r) => r.id === id)!, estado: 'CANCELADA', posicionEspera: null })
      : pedir<Reserva>(`/api/reservas/${id}/cancelar`, 'PATCH'),

  asistencia: (id: number, asistio: boolean) =>
    USAR_MOCK
      ? simular<Reserva>({ ...reservasMock.find((r) => r.id === id)!, asistio })
      : pedir<Reserva>(`/api/reservas/${id}/asistencia`, 'PATCH', { asistio }),
}
