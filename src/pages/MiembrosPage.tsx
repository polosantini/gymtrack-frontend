import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { miembrosApi } from '../api/miembros'
import type { Miembro } from '../api/types'
import { Icono } from '../components/Icono'
import { Badge, ErrorConexion, EsqueletoTabla, EstadoVacio, PageHeader, Toast, type Tono } from '../components/ui'
import { useCarga } from '../hooks/useCarga'
import { fecha, iniciales, NOMBRE_ESTADO_MEMBRESIA, NOMBRE_PLAN } from '../utils/formato'
import { RegistrarMiembroModal } from './RegistrarMiembroModal'

const TONO_ESTADO: Record<string, Tono> = { ACTIVA: 'green', VENCIDA: 'red', SUSPENDIDA: 'amber' }

export function MiembrosPage() {
  const { datos, cargando, error, recargar, setDatos } = useCarga(() => miembrosApi.listar())
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [aviso, setAviso] = useState('')
  const cerrarAviso = useCallback(() => setAviso(''), [])

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return (datos ?? []).filter((m) => [m.nombre, m.email].some((v) => v.toLowerCase().includes(q)))
  }, [datos, busqueda])

  const alRegistrar = (nuevo: Miembro) => {
    setDatos([...(datos ?? []), nuevo])
    setModalAbierto(false)
    setAviso('Miembro registrado')
  }

  return (
    <>
      <PageHeader titulo="Miembros" accion="+ Nuevo miembro" alAccionar={() => setModalAbierto(true)} />
      {error && <ErrorConexion mensaje={error} reintentar={recargar} />}
      <section className="panel">
        <div className="toolbar">
          <div className="search-field">
            <Icono nombre="search" tamano={18} />
            <input
              aria-label="Buscar miembros"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o email"
            />
          </div>
          <span>{filtrados.length} miembros</span>
        </div>

        {cargando ? (
          <EsqueletoTabla />
        ) : filtrados.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Plan</th>
                  <th>Estado</th>
                  <th>Vence</th>
                  <th>Registro</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((m) => (
                  <FilaMiembro key={m.id} miembro={m} />
                ))}
              </tbody>
            </table>
          </div>
        ) : busqueda ? (
          <div className="no-results">No se encontraron miembros para “{busqueda}”.</div>
        ) : error ? null : (
          <EstadoVacio texto="Aún no hay miembros registrados" accion="+ Nuevo miembro" alAccionar={() => setModalAbierto(true)} />
        )}
      </section>

      {modalAbierto && <RegistrarMiembroModal alCerrar={() => setModalAbierto(false)} alRegistrar={alRegistrar} />}
      {aviso && <Toast mensaje={aviso} alCerrar={cerrarAviso} />}
    </>
  )
}

function FilaMiembro({ miembro }: { miembro: Miembro }) {
  const navegar = useNavigate()
  const membresia = miembro.membresia
  return (
    <tr className="clickable-row" onClick={() => navegar(`/miembros/${miembro.id}`)} title="Ver detalle del miembro">
      <td>
        <div className="member-name">
          <span>{iniciales(miembro.nombre)}</span>
          <div>
            <strong>{miembro.nombre}</strong>
            <small>{miembro.email}</small>
          </div>
        </div>
      </td>
      <td className={membresia ? '' : 'muted'}>{membresia ? NOMBRE_PLAN[membresia.plan] : '—'}</td>
      <td>
        {membresia ? (
          <Badge tono={TONO_ESTADO[membresia.estado]}>{NOMBRE_ESTADO_MEMBRESIA[membresia.estado]}</Badge>
        ) : (
          <Badge>Sin membresía</Badge>
        )}
      </td>
      <td className="date-cell">
        {membresia ? (
          <>
            <small>{membresia.estado === 'VENCIDA' ? 'Venció' : 'Vence'}</small>
            {fecha(membresia.fechaVencimiento)}
          </>
        ) : (
          '—'
        )}
      </td>
      <td>{fecha(miembro.fechaRegistro)}</td>
    </tr>
  )
}
