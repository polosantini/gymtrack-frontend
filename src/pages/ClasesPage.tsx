import { useCallback, useState } from 'react'
import { clasesApi } from '../api/clases'
import type { Clase } from '../api/types'
import { Icono } from '../components/Icono'
import { ErrorConexion, EsqueletoHorario, EstadoVacio, PageHeader, Toast } from '../components/ui'
import { useCarga } from '../hooks/useCarga'
import { DIAS, hora } from '../utils/formato'
import { CrearClaseModal } from './CrearClaseModal'

// Vista de horario semanal: muestra el aforo máximo, no la ocupación.
// Los cupos libres dependen de cada fecha y se ven en Reservar (fase 2).
export function ClasesPage() {
  const { datos, cargando, error, recargar, setDatos } = useCarga(() => clasesApi.listar())
  const [modalAbierto, setModalAbierto] = useState(false)
  const [aviso, setAviso] = useState('')
  const cerrarAviso = useCallback(() => setAviso(''), [])

  const alCrear = (nueva: Clase) => {
    setDatos([...(datos ?? []), nueva])
    setModalAbierto(false)
    setAviso('Clase creada')
  }

  const clases = datos ?? []

  return (
    <>
      <PageHeader titulo="Clases" accion="+ Nueva clase" alAccionar={() => setModalAbierto(true)} />
      {error && <ErrorConexion mensaje={error} reintentar={recargar} />}

      {cargando ? (
        <EsqueletoHorario />
      ) : clases.length > 0 ? (
        <section className="weekly-schedule" aria-label="Horario semanal de clases">
          {DIAS.map((dia) => {
            const delDia = clases
              .filter((c) => c.dias.includes(dia.valor))
              .sort((a, b) => a.hora.localeCompare(b.hora))
            return (
              <div className="schedule-day" key={dia.valor}>
                <header>
                  <h2>{dia.largo}</h2>
                  <span>
                    {delDia.length} {delDia.length === 1 ? 'clase' : 'clases'}
                  </span>
                </header>
                <div className="schedule-day-body">
                  {delDia.length > 0 ? (
                    delDia.map((c) => <TarjetaClase key={c.id} clase={c} />)
                  ) : (
                    <div className="no-classes">
                      <Icono nombre="calendar" tamano={17} />
                      <span>Sin clases</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </section>
      ) : error ? null : (
        <section className="panel">
          <EstadoVacio texto="Aún no hay clases creadas" accion="+ Nueva clase" alAccionar={() => setModalAbierto(true)} />
        </section>
      )}

      {modalAbierto && <CrearClaseModal alCerrar={() => setModalAbierto(false)} alCrear={alCrear} />}
      {aviso && <Toast mensaje={aviso} alCerrar={cerrarAviso} />}
    </>
  )
}

function TarjetaClase({ clase }: { clase: Clase }) {
  return (
    <article className="schedule-class">
      <time>{hora(clase.hora)}</time>
      <h3>{clase.nombre}</h3>
      <p className="schedule-instructor">
        <Icono nombre="user" tamano={14} />
        {clase.instructor}
      </p>
      <div className="schedule-details">
        <span>
          <Icono nombre="clock" tamano={13} />
          {clase.duracionMinutos} min
        </span>
        <span>
          <Icono nombre="pin" tamano={13} />
          {clase.sala}
        </span>
      </div>
      <p className="class-capacity">Aforo: {clase.aforo} personas</p>
    </article>
  )
}
