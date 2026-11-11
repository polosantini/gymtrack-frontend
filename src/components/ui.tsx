// Componentes visuales comunes, tomados del diseño de Figma Make.
import { useEffect, type ReactNode } from 'react'
import { Icono } from './Icono'

export type Tono = 'green' | 'amber' | 'red' | 'neutral'

export function Badge({ children, tono = 'neutral' }: { children: ReactNode; tono?: Tono }) {
  return <span className={`badge badge-${tono}`}>{children}</span>
}

export function PageHeader({ titulo, accion, alAccionar, contexto = 'Panel de administración' }: {
  titulo: string
  accion?: string
  alAccionar?: () => void
  contexto?: string
}) {
  return (
    <header className="page-header">
      <div>
        <p>{contexto}</p>
        <h1>{titulo}</h1>
      </div>
      {accion && (
        <button className="primary-button" onClick={alAccionar}>
          {accion}
        </button>
      )}
    </header>
  )
}

export function Toast({ mensaje, alCerrar }: { mensaje: string; alCerrar: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(alCerrar, 4000)
    return () => window.clearTimeout(t)
  }, [alCerrar])
  return (
    <div className="toast" role="status">
      <span className="toast-icon">
        <Icono nombre="check" tamano={15} />
      </span>
      <span>{mensaje}</span>
      <button onClick={alCerrar} aria-label="Cerrar aviso">
        <Icono nombre="close" tamano={16} />
      </button>
    </div>
  )
}

export function Modal({ titulo, alCerrar, children }: { titulo: string; alCerrar: () => void; children: ReactNode }) {
  useEffect(() => {
    const alPresionar = (e: KeyboardEvent) => e.key === 'Escape' && alCerrar()
    window.addEventListener('keydown', alPresionar)
    return () => window.removeEventListener('keydown', alPresionar)
  }, [alCerrar])
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={alCerrar}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">GymTrack</p>
            <h2 id="modal-title">{titulo}</h2>
          </div>
          <button className="icon-button" onClick={alCerrar} aria-label="Cerrar">
            <Icono nombre="close" tamano={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function AccionesModal({ alCerrar, enviando }: { alCerrar: () => void; enviando: boolean }) {
  return (
    <div className="modal-actions">
      <button type="button" className="secondary-button" onClick={alCerrar} disabled={enviando}>
        Cancelar
      </button>
      <button type="submit" className="primary-button" disabled={enviando}>
        {enviando ? 'Guardando…' : 'Guardar'}
      </button>
    </div>
  )
}

export function Campo({ etiqueta, obligatorio, ayuda, error, children }: {
  etiqueta: string
  obligatorio?: boolean
  ayuda?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className={`field ${error ? 'field-error' : ''}`}>
      <span>
        {etiqueta}
        {obligatorio && <b> *</b>}
        {ayuda && <small>{ayuda}</small>}
      </span>
      {children}
      {error && <em>{error}</em>}
    </label>
  )
}

/** Error que devolvió la API dentro de un formulario (ej. 409 email repetido). */
export function AlertaFormulario({ mensaje }: { mensaje: string }) {
  return (
    <div className="form-alert" role="alert">
      <Icono nombre="alert" tamano={17} />
      {mensaje}
    </div>
  )
}

/** Error al cargar datos de la API, con opción de reintentar. */
export function ErrorConexion({ mensaje, reintentar }: { mensaje: string; reintentar: () => void }) {
  return (
    <div className="connection-error" role="alert">
      <span className="alert-icon">
        <Icono nombre="alert" tamano={18} />
      </span>
      <div>
        <strong>{mensaje}</strong>
        <span>Verifica tu conexión e inténtalo nuevamente.</span>
      </div>
      <button className="retry-button" onClick={reintentar}>
        Reintentar
      </button>
    </div>
  )
}

export function EsqueletoTabla() {
  return (
    <div className="skeleton-table" aria-label="Cargando">
      {[1, 2, 3, 4].map((n) => (
        <div key={n}>
          <i /><i /><i /><i /><i />
        </div>
      ))}
    </div>
  )
}

export function EsqueletoHorario() {
  return (
    <div className="weekly-schedule schedule-skeleton" aria-label="Cargando">
      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
        <div className="schedule-day" key={n}>
          <i className="skeleton-heading" />
          <div className="schedule-day-body">
            <div className="schedule-class skeleton-card">
              <i /><i /><i />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function EstadoVacio({ texto, accion, alAccionar }: { texto: string; accion?: string; alAccionar?: () => void }) {
  return (
    <div className="empty-state">
      <span>
        <Icono nombre="empty" tamano={28} />
      </span>
      <h3>{texto}</h3>
      {accion && (
        <button className="primary-button" onClick={alAccionar}>
          {accion}
        </button>
      )}
    </div>
  )
}
