// Colores (tono del badge) y textos de los estados que vienen del backend.
import type { EstadoMembresia, EstadoReserva, Membresia, Reserva } from '../api/types'
import type { Tono } from '../components/ui'
import { diasHasta } from './formato'

export const TONO_MEMBRESIA: Record<string, Tono> = { ACTIVA: 'green', VENCIDA: 'red', SUSPENDIDA: 'amber' }
export const TONO_RESERVA: Record<EstadoReserva, Tono> = { CONFIRMADA: 'green', EN_ESPERA: 'amber', CANCELADA: 'red' }

/**
 * Estado que se muestra en pantalla.
 *
 * El backend guarda el estado y la fecha de vencimiento por separado, y solo la tarea
 * diaria de vencimientos los reconcilia: hasta que corre, una membresía puede seguir
 * en ACTIVA con la fecha ya pasada. GET /api/miembros/{id}/acceso exige las dos cosas
 * (estado ACTIVA y vencimiento de hoy en adelante), así que la interfaz aplica el mismo
 * criterio y no muestra "Activa" a quien el backend ya no deja entrar.
 */
export function estadoMostrado(m: Pick<Membresia, 'estado' | 'fechaVencimiento'>): EstadoMembresia {
  return m.estado === 'ACTIVA' && diasHasta(m.fechaVencimiento) < 0 ? 'VENCIDA' : m.estado
}

/** 'Confirmada', 'En espera · posición 2' o 'Cancelada'. */
export function textoEstadoReserva(r: Pick<Reserva, 'estado' | 'posicionEspera'>): string {
  if (r.estado === 'EN_ESPERA') return `En espera · posición ${r.posicionEspera ?? '—'}`
  return r.estado === 'CONFIRMADA' ? 'Confirmada' : 'Cancelada'
}
