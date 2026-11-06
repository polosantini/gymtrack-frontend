import { pagosApi } from '../api/pagos'
import { Cargando, ErrorCarga } from '../components/Estado'
import { useCarga } from '../hooks/useCarga'

export function PagosPage() {
  const { datos, cargando, error, recargar } = useCarga(() => pagosApi.delMiembro())
  return (
    <section>
      <h2>Pagos</h2>
      {cargando && <Cargando />}
      {error && <ErrorCarga mensaje={error} reintentar={recargar} />}
      <table>
        <thead>
          <tr><th>Fecha</th><th>Miembro</th><th>Plan</th><th>Periodo</th><th>Monto</th><th>Estado</th></tr>
        </thead>
        <tbody>
          {datos?.map((p) => (
            <tr key={p.id}>
              <td>{p.fecha}</td>
              <td>#{p.miembroId}</td>
              <td>{p.plan}</td>
              <td>{p.periodo}</td>
              <td>${p.monto.toLocaleString('es-CO')}</td>
              <td>{p.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
