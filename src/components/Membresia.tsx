// Piezas compartidas por las vistas del miembro y el detalle de miembro (diseño de Figma Make).
import type { Acceso, Membresia, Reserva } from '../api/types'
import { TONO_MEMBRESIA } from '../utils/estados'
import { fecha, fechaLarga, NOMBRE_ESTADO_MEMBRESIA, NOMBRE_PLAN, textoVencimiento } from '../utils/formato'
import { Icono } from './Icono'
import { Badge, Modal } from './ui'

/** Tarjeta "Membresía actual": plan, estado y fechas. */
export function TarjetaMembresia({ membresia, compacta = false }: { membresia: Membresia | null; compacta?: boolean }) {
  return (
    <section className={`panel membership-card ${compacta ? 'compact' : ''}`}>
      <div className="detail-card-heading">
        <div>
          <p>Membresía actual</p>
          <h2>{membresia ? `Plan ${NOMBRE_PLAN[membresia.plan] ?? membresia.plan}` : 'Sin membresía'}</h2>
        </div>
        {membresia ? (
          <Badge tono={TONO_MEMBRESIA[membresia.estado]}>{NOMBRE_ESTADO_MEMBRESIA[membresia.estado] ?? membresia.estado}</Badge>
        ) : (
          <Badge>Sin membresía</Badge>
        )}
      </div>
      {membresia && (
        <div className="membership-data">
          <div>
            <span>Fecha de inicio</span>
            <strong>{fecha(membresia.fechaInicio)}</strong>
          </div>
          <div>
            <span>Fecha de vencimiento</span>
            <strong>{fecha(membresia.fechaVencimiento)}</strong>
          </div>
          <div>
            <span>Vigencia</span>
            <strong>{textoVencimiento(membresia.fechaVencimiento)}</strong>
          </div>
        </div>
      )}
    </section>
  )
}

/** Tarjeta "Acceso al gimnasio" con la respuesta de GET /api/miembros/{id}/acceso. */
export function TarjetaAcceso({ acceso, textoActiva, textoInactiva }: {
  acceso: Acceso
  textoActiva: string
  textoInactiva: string
}) {
  return (
    <section className="panel access-card">
      <span className={`access-icon ${acceso.activa ? 'allowed' : 'blocked'}`}>
        <Icono nombre={acceso.activa ? 'check' : 'close'} tamano={22} />
      </span>
      <div>
        <p>Acceso al gimnasio</p>
        <h2>{acceso.activa ? 'Puede reservar' : 'Sin acceso'}</h2>
        <span>{acceso.activa ? textoActiva : textoInactiva}</span>
      </div>
    </section>
  )
}

/** Confirmación antes de PATCH /api/reservas/{id}/cancelar. */
export function CancelarReservaModal({ reserva, enviando, error, alCerrar, alConfirmar }: {
  reserva: Reserva
  enviando: boolean
  error: string
  alCerrar: () => void
  alConfirmar: () => void
}) {
  return (
    <Modal titulo="Cancelar reserva" alCerrar={alCerrar}>
      <div className="confirmation-content">
        <span className="confirmation-icon">
          <Icono nombre="alert" tamano={23} />
        </span>
        <h3>
          ¿Cancelar tu reserva de {reserva.claseNombre} el {fechaLarga(reserva.fecha)}?
        </h3>
        <p>
          {reserva.estado === 'EN_ESPERA'
            ? 'Saldrás de la lista de espera de esta clase.'
            : 'Tu cupo quedará disponible para otro miembro.'}
        </p>
        {error && (
          <p className="booking-error">
            <Icono nombre="alert" tamano={14} />
            {error}
          </p>
        )}
      </div>
      <div className="modal-actions standalone-actions">
        <button type="button" className="secondary-button" onClick={alCerrar} disabled={enviando}>
          Volver
        </button>
        <button type="button" className="danger-button" onClick={alConfirmar} disabled={enviando}>
          {enviando ? 'Cancelando…' : 'Cancelar reserva'}
        </button>
      </div>
    </Modal>
  )
}
