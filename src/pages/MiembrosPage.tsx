import { miembrosApi } from '../api/miembros'
import { Cargando, ErrorCarga } from '../components/Estado'
import { useCarga } from '../hooks/useCarga'

export function MiembrosPage() {
  const { datos, cargando, error, recargar } = useCarga(() => miembrosApi.listar())
  return (
    <section>
      <h2>Miembros</h2>
      {cargando && <Cargando />}
      {error && <ErrorCarga mensaje={error} reintentar={recargar} />}
      <table>
        <thead>
          <tr><th>Nombre</th><th>Documento</th><th>Plan</th><th>Estado</th><th>Vence</th></tr>
        </thead>
        <tbody>
          {datos?.map((m) => (
            <tr key={m.id}>
              <td>{m.nombre}</td>
              <td>{m.documento}</td>
              <td>{m.membresia?.plan ?? '—'}</td>
              <td>{m.membresia?.estado ?? 'Sin membresía'}</td>
              <td>{m.membresia?.fechaVencimiento ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
