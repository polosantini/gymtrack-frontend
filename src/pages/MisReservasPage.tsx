import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { reservasApi } from '../api/clases'
import type { Reserva } from '../api/types'
import { Icono } from '../components/Icono'
import { CancelarReservaModal } from '../components/Membresia'
import { Badge, ErrorConexion, EsqueletoTabla, EstadoVacio, PageHeader, Toast } from '../components/ui'
import { useUsuarioActual } from '../context/usuarioActual'
import { useCarga } from '../hooks/useCarga'
import { TONO_RESERVA, textoEstadoReserva } from '../utils/estados'
import { diaCorto, fecha, hoyIso, hora, mensajeDe } from '../utils/formato'
import { AvisoElegirMiembro } from './ReservarPage'

/** Vista del miembro: próximas reservas (con cancelar) e historial de asistencia. */
export function MisReservasPage() {
  const { usuario } = useUsuarioActual()
  if (usuario.rol !== 'MIEMBRO') return <AvisoElegirMiembro titulo="Mis reservas" />
  return <MisReservas miembroId={usuario.miembroId} />
}

function MisReservas({ miembroId }: { miembroId: number }) {
  const navegar = useNavigate()
  const { datos, cargando, error, recargar } = useCarga(() => reservasApi.delMiembro(miembroId), [miembroId])
  const [cancelando, setCancelando] = useState<Reserva | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [errorCancelar, setErrorCancelar] = useState('')
  const [aviso, setAviso] = useState('')
  const cerrarAviso = useCallback(() => setAviso(''), [])

  const hoy = hoyIso()
  // Próximas: desde hoy, sin canceladas, la más cercana primero
  const proximas = (datos ?? [])
    .filter((r) => r.fecha >= hoy && r.estado !== 'CANCELADA')
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora))
  // Historial: fechas pasadas (el backend ya las ordena de la más reciente a la más antigua)
  const historial = (datos ?? []).filter((r) => r.fecha < hoy)
  const conAsistencia = historial.filter((r) => r.estado === 'CONFIRMADA')
  const asistio = conAsistencia.filter((r) => r.asistencia === true).length
  const porcentaje = conAsistencia.length ? Math.round((asistio / conAsistencia.length) * 100) : 0

  const cancelar = async () => {
    if (!cancelando) return
    setEnviando(true)
    setErrorCancelar('')
    try {
      await reservasApi.cancelar(cancelando.id)
      setCancelando(null)
      setAviso('Reserva cancelada')
      void recargar()
    } catch (e) {
      setErrorCancelar(mensajeDe(e))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <PageHeader titulo="Mis reservas" contexto="Área de miembro" />
      {error ? (
        <ErrorConexion mensaje={error} reintentar={recargar} />
      ) : cargando && !datos ? (
        <section className="panel">
          <EsqueletoTabla />
        </section>
      ) : (
        <>
          <section className="reservation-section">
            <div className="section-heading">
              <div>
                <h2>Próximas</h2>
                <p>Tus clases reservadas para los próximos días</p>
              </div>
              <span>
                {proximas.length} {proximas.length === 1 ? 'reserva' : 'reservas'}
              </span>
            </div>
            {proximas.length ? (
              <div className="upcoming-grid">
                {proximas.map((r) => {
                  const { corto, numero } = diaCorto(r.fecha)
                  return (
                    <article className="upcoming-card" key={r.id}>
                      <div className="reservation-date">
                        <small>{corto}</small>
                        <strong>{numero}</strong>
                      </div>
                      <div className="reservation-info">
                        <Badge tono={TONO_RESERVA[r.estado]}>{textoEstadoReserva(r)}</Badge>
                        <h3>{r.claseNombre}</h3>
                        <p>
                          <Icono nombre="clock" tamano={14} />
                          {hora(r.hora)}
                        </p>
                      </div>
                      <button
                        className="secondary-button"
                        onClick={() => {
                          setErrorCancelar('')
                          setCancelando(r)
                        }}
                      >
                        Cancelar
                      </button>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="panel">
                <EstadoVacio texto="Aún no tienes reservas" accion="Reservar una clase" alAccionar={() => navegar('/reservar')} />
              </div>
            )}
          </section>
          <section className="reservation-section history-section">
            <div className="section-heading">
              <div>
                <h2>Historial</h2>
                <p>
                  {conAsistencia.length
                    ? `Asistencia: ${asistio} de ${conAsistencia.length} ${conAsistencia.length === 1 ? 'clase' : 'clases'} (${porcentaje} %)`
                    : 'Aún no tienes clases pasadas'}
                </p>
              </div>
              <Badge>
                {historial.length} {historial.length === 1 ? 'registro' : 'registros'}
              </Badge>
            </div>
            {historial.length > 0 && (
              <div className="panel">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Clase</th>
                      <th>Hora</th>
                      <th>Estado</th>
                      <th>Asistencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((r) => (
                      <tr key={r.id}>
                        <td>{fecha(r.fecha)}</td>
                        <td>
                          <strong>{r.claseNombre}</strong>
                        </td>
                        <td>{hora(r.hora)}</td>
                        <td>
                          <Badge tono={TONO_RESERVA[r.estado]}>{textoEstadoReserva(r)}</Badge>
                        </td>
                        <td className={`attendance ${r.asistencia === true ? 'attended' : r.asistencia === false ? 'missed' : ''}`}>
                          {r.asistencia === true ? '✓ Asistió' : r.asistencia === false ? '✗ No asistió' : '— Sin marcar'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
      {cancelando && (
        <CancelarReservaModal
          reserva={cancelando}
          enviando={enviando}
          error={errorCancelar}
          alCerrar={() => setCancelando(null)}
          alConfirmar={() => void cancelar()}
        />
      )}
      {aviso && <Toast mensaje={aviso} alCerrar={cerrarAviso} />}
    </>
  )
}
