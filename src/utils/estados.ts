// Colores (tono del badge) y textos de los estados que vienen del backend.
import type { EstadoReserva, Reserva } from '../api/types'
import type { Tono } from '../components/ui'

export const TONO_MEMBRESIA: Record<string, Tono> = { ACTIVA: 'green', VENCIDA: 'red', SUSPENDIDA: 'amber' }
export const TONO_RESERVA: Record<EstadoReserva, Tono> = { CONFIRMADA: 'green', EN_ESPERA: 'amber', CANCELADA: 'red' }

/** 'Confirmada', 'En espera · posición 2' o 'Cancelada'. */
export function textoEstadoReserva(r: Pick<Reserva, 'estado' | 'posicionEspera'>): string {
  if (r.estado === 'EN_ESPERA') return `En espera · posición ${r.posicionEspera ?? '—'}`
  return r.estado === 'CONFIRMADA' ? 'Confirmada' : 'Cancelada'
}
