import { clasesApi } from '../api/clases'
import { Cargando, ErrorCarga } from '../components/Estado'
import { useCarga } from '../hooks/useCarga'

export function ReservarPage() {
  const { datos, cargando, error, recargar } = useCarga(() => clasesApi.listar())
  return (
    <section>
      <h2>Reservar clases</h2>
      {cargando && <Cargando />}
      {error && <ErrorCarga mensaje={error} reintentar={recargar} />}
      <ul>
        {datos?.map((c) => (
          <li key={c.id}>
            {c.nombre} · {c.fecha} {c.hora} · {c.cuposLibres > 0 ? `${c.cuposLibres} cupos libres` : 'Llena (lista de espera)'}
          </li>
        ))}
      </ul>
    </section>
  )
}
