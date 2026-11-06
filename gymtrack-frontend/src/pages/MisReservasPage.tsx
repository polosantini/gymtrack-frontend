import { reservasApi } from '../api/clases'
import { Cargando, ErrorCarga } from '../components/Estado'
import { useUsuarioActual } from '../context/usuarioActual'
import { useCarga } from '../hooks/useCarga'

export function MisReservasPage() {
  const { usuario } = useUsuarioActual()
  const miembroId = usuario.rol === 'MIEMBRO' ? usuario.miembroId : 0
  const { datos, cargando, error, recargar } = useCarga(() => reservasApi.delMiembro(miembroId), [miembroId])
  return (
    <section>
      <h2>Mis reservas</h2>
      {cargando && <Cargando />}
      {error && <ErrorCarga mensaje={error} reintentar={recargar} />}
      {datos?.length === 0 && <p className="muted">No tienes reservas.</p>}
      <ul>
        {datos?.map((r) => (
          <li key={r.id}>
            {r.fecha} · {r.claseNombre} · {r.estado}
            {r.posicionEspera ? ` (posición ${r.posicionEspera})` : ''}
          </li>
        ))}
      </ul>
    </section>
  )
}
