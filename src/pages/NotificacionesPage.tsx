import { notificacionesApi } from '../api/pagos'
import { Cargando, ErrorCarga } from '../components/Estado'
import { useUsuarioActual } from '../context/usuarioActual'
import { useCarga } from '../hooks/useCarga'

export function NotificacionesPage() {
  const { usuario } = useUsuarioActual()
  const miembroId = usuario.rol === 'MIEMBRO' ? usuario.miembroId : 0
  const { datos, cargando, error, recargar } = useCarga(() => notificacionesApi.delMiembro(miembroId), [miembroId])
  return (
    <section>
      <h2>Notificaciones</h2>
      {cargando && <Cargando />}
      {error && <ErrorCarga mensaje={error} reintentar={recargar} />}
      {datos?.length === 0 && <p className="muted">No tienes notificaciones.</p>}
      <ul>
        {datos?.map((n) => (
          <li key={n.id} className={n.leida ? '' : 'no-leida'}>
            {n.fecha} · {n.mensaje}
          </li>
        ))}
      </ul>
    </section>
  )
}
