import { useCallback, useState } from 'react'
import { notificacionesApi } from '../api/pagos'
import type { Notificacion, TipoNotificacion } from '../api/types'
import { Icono, type NombreIcono } from '../components/Icono'
import { Badge, ErrorConexion, EstadoVacio, PageHeader, Toast } from '../components/ui'
import { useUsuarioActual } from '../context/usuarioActual'
import { useCarga } from '../hooks/useCarga'
import { fechaHora } from '../utils/formato'
import { AvisoElegirMiembro } from './ReservarPage'

// Cada flujo de mensajería de la Fase 3 termina en una notificación de pagos-service
const TIPOS: Record<TipoNotificacion, { titulo: string; icono: NombreIcono; clase: string }> = {
  CUPO_LIBERADO: { titulo: 'Se liberó un cupo para ti', icono: 'calendar', clase: 'spot' }, // reserva.cupo.asignado
  VENCIMIENTO_PROXIMO: { titulo: 'Tu membresía está por vencer', icono: 'clock', clase: 'expiry' }, // membresia.proxima.vencer
  CONFIRMACION_PAGO: { titulo: 'Pago confirmado', icono: 'card', clase: 'payment' }, // pago.registrado
}

/** Vista del miembro: GET /api/notificaciones?miembroId= (la más reciente primero). */
export function NotificacionesPage() {
  const { usuario } = useUsuarioActual()
  if (usuario.rol !== 'MIEMBRO') return <AvisoElegirMiembro titulo="Notificaciones" />
  return <Notificaciones miembroId={usuario.miembroId} />
}

function Notificaciones({ miembroId }: { miembroId: number }) {
  // Sin tiempo real: se cargan al entrar a la pantalla o con el botón Actualizar
  const { datos, cargando, error, recargar } = useCarga(() => notificacionesApi.delMiembro(miembroId), [miembroId])
  const [aviso, setAviso] = useState('')
  const cerrarAviso = useCallback(() => setAviso(''), [])
  const sinLeer = datos?.filter((n) => !n.leida).length ?? 0

  const actualizar = async () => {
    if (await recargar()) setAviso('Notificaciones actualizadas')
  }

  return (
    <>
      <PageHeader
        titulo="Notificaciones"
        contexto="Área de miembro"
        extra={
          <button className="secondary-button" onClick={() => void actualizar()} disabled={cargando}>
            {cargando ? 'Actualizando…' : 'Actualizar'}
          </button>
        }
      />
      {error && <ErrorConexion mensaje={error} reintentar={recargar} />}
      <section className="notification-section">
        <div className="section-heading notification-heading">
          <div>
            <h2>Recientes</h2>
            <p>Pagos, vencimientos y cupos liberados en tus clases</p>
          </div>
          {datos && <span>{sinLeer} sin leer</span>}
        </div>
        {cargando ? (
          <div className="notification-list notification-loading" aria-label="Actualizando">
            {[1, 2, 3].map((i) => (
              <div className="notification-skeleton" key={i}>
                <i />
                <div>
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            ))}
          </div>
        ) : datos && datos.length > 0 ? (
          <div className="notification-list">
            {datos.map((n) => (
              <TarjetaNotificacion key={n.id} notificacion={n} />
            ))}
          </div>
        ) : error ? null : (
          <div className="panel">
            <EstadoVacio texto="No tienes notificaciones" accion="Actualizar" alAccionar={() => void actualizar()} />
          </div>
        )}
      </section>
      {aviso && <Toast mensaje={aviso} alCerrar={cerrarAviso} />}
    </>
  )
}

function TarjetaNotificacion({ notificacion: n }: { notificacion: Notificacion }) {
  const tipo = TIPOS[n.tipo] ?? { titulo: 'Aviso', icono: 'bell' as NombreIcono, clase: 'spot' }
  return (
    <article className={`notification-card ${n.leida ? '' : 'notification-unread'}`}>
      <span className={`notification-icon notification-icon-${tipo.clase}`}>
        <Icono nombre={tipo.icono} tamano={20} />
      </span>
      <div className="notification-copy">
        <h3>{tipo.titulo}</h3>
        <p>{n.mensaje}</p>
        <time dateTime={n.fecha}>{fechaHora(n.fecha)}</time>
      </div>
      {!n.leida && <Badge tono="green">Nueva</Badge>}
    </article>
  )
}
