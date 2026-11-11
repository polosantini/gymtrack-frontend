import { useNavigate, useParams } from 'react-router-dom'
import { reservasApi } from '../api/clases'
import { miembrosApi } from '../api/miembros'
import { pagosApi } from '../api/pagos'
import { TarjetaAcceso, TarjetaMembresia } from '../components/Membresia'
import { Badge, ErrorConexion, EsqueletoTabla, type Tono } from '../components/ui'
import { useCarga } from '../hooks/useCarga'
import { TONO_RESERVA, textoEstadoReserva } from '../utils/estados'
import { fecha, iniciales, NOMBRE_ESTADO_PAGO, NOMBRE_PERIODO, NOMBRE_PLAN, pesos } from '../utils/formato'

const TONO_PAGO: Record<string, Tono> = { REGISTRADO: 'neutral', COMPLETADO: 'green', PENDIENTE: 'amber', FALLIDO: 'red' }

/** Vista del administrador: detalle de un miembro con su membresía, acceso, reservas y pagos. */
export function MiembroDetallePage() {
  const { id } = useParams()
  const miembroId = Number(id)
  const navegar = useNavigate()

  // Miembros es la fuente principal; reservas y pagos vienen de otros servicios
  const { datos, cargando, error, recargar } = useCarga(async () => {
    const [miembro, acceso] = await Promise.all([miembrosApi.obtener(miembroId), miembrosApi.acceso(miembroId)])
    return { miembro, acceso }
  }, [miembroId])
  const reservas = useCarga(() => reservasApi.delMiembro(miembroId), [miembroId])
  const pagos = useCarga(() => pagosApi.delMiembro(miembroId), [miembroId])

  return (
    <>
      <button className="back-link" onClick={() => navegar('/miembros')}>
        ← Miembros
      </button>
      {error ? (
        <ErrorConexion mensaje={error} reintentar={recargar} />
      ) : cargando || !datos ? (
        <section className="panel">
          <EsqueletoTabla />
        </section>
      ) : (
        <>
          <div className="member-profile-header">
            <span>{iniciales(datos.miembro.nombre)}</span>
            <div>
              <h1>{datos.miembro.nombre}</h1>
              <p>
                {datos.miembro.email} · Registrado el {fecha(datos.miembro.fechaRegistro)}
              </p>
            </div>
          </div>
          <div className="detail-overview">
            <TarjetaMembresia membresia={datos.miembro.membresia} compacta />
            <TarjetaAcceso
              acceso={datos.acceso}
              textoActiva="Membresía activa y al día."
              textoInactiva={
                datos.miembro.membresia ? 'La membresía no está activa: no puede reservar.' : 'Debe adquirir una membresía para reservar.'
              }
            />
          </div>
          <div className="detail-tables">
            <section className="panel">
              <div className="small-table-heading">
                <h2>Reservas</h2>
                <span>Más recientes primero</span>
              </div>
              {reservas.error ? (
                <ErrorConexion mensaje={reservas.error} reintentar={reservas.recargar} />
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Clase</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservas.datos?.length ? (
                      reservas.datos.map((r) => (
                        <tr key={r.id}>
                          <td>{fecha(r.fecha)}</td>
                          <td>
                            <strong>{r.claseNombre}</strong>
                          </td>
                          <td>
                            <Badge tono={TONO_RESERVA[r.estado]}>{textoEstadoReserva(r)}</Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="empty-cell">
                          {reservas.cargando ? 'Cargando…' : 'Sin reservas'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </section>
            <section className="panel">
              <div className="small-table-heading">
                <h2>Pagos</h2>
                <span>Historial del miembro</span>
              </div>
              {pagos.error ? (
                <ErrorConexion mensaje={pagos.error} reintentar={pagos.recargar} />
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Plan</th>
                      <th>Periodo</th>
                      <th>Monto</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.datos?.length ? (
                      pagos.datos.map((p) => (
                        <tr key={p.id}>
                          <td>{fecha(p.fecha)}</td>
                          <td>{NOMBRE_PLAN[p.plan] ?? p.plan}</td>
                          <td>{NOMBRE_PERIODO[p.periodo] ?? p.periodo}</td>
                          <td>{pesos(p.monto)}</td>
                          <td>
                            <Badge tono={TONO_PAGO[p.estado]}>{NOMBRE_ESTADO_PAGO[p.estado] ?? p.estado}</Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="empty-cell">
                          {pagos.cargando ? 'Cargando…' : 'Sin pagos registrados'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        </>
      )}
    </>
  )
}
