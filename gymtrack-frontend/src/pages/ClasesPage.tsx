import { clasesApi } from '../api/clases'
import { Cargando, ErrorCarga } from '../components/Estado'
import { useCarga } from '../hooks/useCarga'

export function ClasesPage() {
  const { datos, cargando, error, recargar } = useCarga(() => clasesApi.listar())
  return (
    <section>
      <h2>Clases</h2>
      {cargando && <Cargando />}
      {error && <ErrorCarga mensaje={error} reintentar={recargar} />}
      <table>
        <thead>
          <tr><th>Clase</th><th>Instructor</th><th>Días</th><th>Hora</th><th>Sala</th><th>Aforo</th></tr>
        </thead>
        <tbody>
          {datos?.map((c) => (
            <tr key={c.id}>
              <td>{c.nombre}</td>
              <td>{c.instructor}</td>
              <td>{c.diasSemana.join(', ')}</td>
              <td>{c.horaInicio}</td>
              <td>{c.sala}</td>
              <td>{c.aforoMaximo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
