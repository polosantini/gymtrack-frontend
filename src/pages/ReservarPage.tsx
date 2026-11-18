import { useCallback, useMemo, useState } from 'react'
import { clasesApi, reservasApi } from '../api/clases'
import { miembrosApi } from '../api/miembros'
import type { Clase, Miembro, Reserva } from '../api/types'
import { Icono } from '../components/Icono'
import { CancelarReservaModal } from '../components/Membresia'
import { Badge, ErrorConexion, EsqueletoTabla, EstadoVacio, PageHeader, Toast } from '../components/ui'
import { useUsuarioActual } from '../context/usuarioActual'
import { useCarga } from '../hooks/useCarga'
import { TONO_RESERVA, textoEstadoReserva } from '../utils/estados'
import { diaCorto, fechaLarga, hoyIso, hora, mensajeDe, NOMBRE_PLAN, REGLA_PLAN, sumarDiasIso } from '../utils/formato'

/** Vista del miembro: elegir día, ver cupos, reservar, unirse a la espera y cancelar. */
export function ReservarPage() {
  const { usuario } = useUsuarioActual()
  if (usuario.rol !== 'MIEMBRO') return <AvisoElegirMiembro titulo="Reservar clases" />
  return <Reservar miembroId={usuario.miembroId} />
}

export function AvisoElegirMiembro({ titulo }: { titulo: string }) {
  return (
    <>
      <PageHeader titulo={titulo} contexto="Área de miembro" />
      <section className="panel">
        <EstadoVacio texto='Elige un miembro en "Actuar como" para ver esta pantalla' />
      </section>
    </>
  )
}

interface ClaseDelDia extends Clase {
  enEspera: number
}

function Reservar({ miembroId }: { miembroId: number }) {
  const dias = useMemo(() => Array.from({ length: 7 }, (_, i) => sumarDiasIso(hoyIso(), i)), [])
  const [dia, setDia] = useState(dias[0])
  const [errorClase, setErrorClase] = useState<{ claseId: number; mensaje: string } | null>(null)
  const [enviando, setEnviando] = useState<number | null>(null)
  const [cancelando, setCancelando] = useState<Reserva | null>(null)
  const [errorCancelar, setErrorCancelar] = useState('')
  const [aviso, setAviso] = useState('')
  const cerrarAviso = useCallback(() => setAviso(''), [])

  const miembro = useCarga(() => miembrosApi.obtener(miembroId), [miembroId])
  const reservas = useCarga(() => reservasApi.delMiembro(miembroId), [miembroId])
  // Clases que se dictan ese día con los cupos de esa fecha; para las llenas, cuántos hay en espera
  const clases = useCarga(async (): Promise<ClaseDelDia[]> => {
    const lista = await clasesApi.listar(dia)
    return Promise.all(
      [...lista]
        .sort((a, b) => a.hora.localeCompare(b.hora))
        .map(async (c) => ({
          ...c,
          enEspera: c.cuposLibres === 0 ? (await clasesApi.reservasDeSesion(c.id, dia)).enEspera.length : 0,
        })),
    )
  }, [dia])

  const activa = miembro.datos?.membresia?.estado === 'ACTIVA'

  const reservaDe = (claseId: number) =>
    reservas.datos?.find((r) => r.claseId === claseId && r.fecha === dia && r.estado !== 'CANCELADA')

  const reservar = async (clase: ClaseDelDia) => {
    setEnviando(clase.id)
    setErrorClase(null)
    try {
      const r = await reservasApi.reservar({ miembroId, claseId: clase.id, fecha: dia })
      setAviso(r.estado === 'CONFIRMADA' ? 'Reserva confirmada' : `Quedaste en la lista de espera (posición ${r.posicionEspera})`)
      void reservas.recargar()
      void clases.recargar()
    } catch (e) {
      // Regla del plan, membresía inactiva, reserva repetida... se muestra el mensaje del backend
      setErrorClase({ claseId: clase.id, mensaje: mensajeDe(e) })
    } finally {
      setEnviando(null)
    }
  }

  const cancelar = async () => {
    if (!cancelando) return
    setEnviando(cancelando.claseId)
    setErrorCancelar('')
    try {
      await reservasApi.cancelar(cancelando.id)
      setCancelando(null)
      setAviso('Reserva cancelada')
      void reservas.recargar()
      void clases.recargar()
      // El cupo liberado pasa al primero en espera por RabbitMQ (Fase 3): se vuelve a consultar un momento después
      window.setTimeout(() => void clases.recargar(), 1500)
    } catch (e) {
      setErrorCancelar(mensajeDe(e))
    } finally {
      setEnviando(null)
    }
  }

  const error = miembro.error ?? reservas.error ?? clases.error
  const reintentar = () => {
    void miembro.recargar()
    void reservas.recargar()
    void clases.recargar()
  }

  return (
    <>
      <PageHeader titulo="Reservar clases" contexto="Área de miembro" />
      {miembro.datos && <BannerMembresia miembro={miembro.datos} />}
      <div className="date-tabs" role="tablist" aria-label="Seleccionar día">
        {dias.map((d, i) => {
          const { corto, numero } = diaCorto(d)
          return (
            <button
              key={d}
              role="tab"
              aria-selected={dia === d}
              className={dia === d ? 'active' : ''}
              onClick={() => {
                setDia(d)
                setErrorClase(null)
              }}
            >
              <small>{i === 0 ? 'Hoy' : corto}</small>
              <strong>{numero}</strong>
            </button>
          )
        })}
      </div>
      <div className="selected-date-heading">
        <h2>{fechaLarga(dia)}</h2>
        {clases.datos && (
          <span>
            {clases.datos.length} {clases.datos.length === 1 ? 'clase' : 'clases'}
          </span>
        )}
      </div>
      {error ? (
        <ErrorConexion mensaje={error} reintentar={reintentar} />
      ) : clases.cargando && !clases.datos ? (
        <section className="panel">
          <EsqueletoTabla />
        </section>
      ) : clases.datos && clases.datos.length > 0 ? (
        <section className="booking-list">
          {clases.datos.map((clase) => (
            <TarjetaClase
              key={clase.id}
              clase={clase}
              reserva={reservaDe(clase.id)}
              activa={activa}
              enviando={enviando === clase.id}
              error={errorClase?.claseId === clase.id ? errorClase.mensaje : ''}
              alReservar={() => void reservar(clase)}
              alCancelar={(r) => {
                setErrorCancelar('')
                setCancelando(r)
              }}
            />
          ))}
        </section>
      ) : (
        <section className="panel">
          <EstadoVacio texto="No hay clases este día" />
        </section>
      )}
      {cancelando && (
        <CancelarReservaModal
          reserva={cancelando}
          enviando={enviando !== null}
          error={errorCancelar}
          alCerrar={() => setCancelando(null)}
          alConfirmar={() => void cancelar()}
        />
      )}
      {aviso && <Toast mensaje={aviso} alCerrar={cerrarAviso} />}
    </>
  )
}

function BannerMembresia({ miembro }: { miembro: Miembro }) {
  const m = miembro.membresia
  const activa = m?.estado === 'ACTIVA'
  return (
    <div className={`membership-banner ${activa ? 'active-membership' : 'inactive-membership'}`}>
      <span>
        <Icono nombre={activa ? 'check' : 'alert'} tamano={17} />
      </span>
      <div>
        <strong>{activa && m ? `Plan ${NOMBRE_PLAN[m.plan]}` : 'Membresía inactiva'}</strong>
        <p>
          {activa && m
            ? `Tu membresía está activa · ${REGLA_PLAN[m.plan]}`
            : 'Tu membresía no está activa. No puedes reservar.'}
        </p>
      </div>
      <Badge tono={activa ? 'green' : 'red'}>{activa ? 'Activa' : 'Sin acceso'}</Badge>
    </div>
  )
}

function TarjetaClase({ clase, reserva, activa, enviando, error, alReservar, alCancelar }: {
  clase: ClaseDelDia
  reserva: Reserva | undefined
  activa: boolean
  enviando: boolean
  error: string
  alReservar: () => void
  alCancelar: (r: Reserva) => void
}) {
  const llena = clase.cuposLibres === 0
  const ocupacion = Math.min(100, ((clase.aforo - clase.cuposLibres) / clase.aforo) * 100)
  return (
    <article className="booking-card">
      <div className="booking-time">
        <Icono nombre="clock" tamano={17} />
        <strong>{hora(clase.hora)}</strong>
        <span>{clase.duracionMinutos} min</span>
      </div>
      <div className="booking-main">
        <h3>{clase.nombre}</h3>
        <p>
          <span>
            <Icono nombre="user" tamano={14} />
            {clase.instructor}
          </span>
          <span>
            <Icono nombre="pin" tamano={14} />
            {clase.sala}
          </span>
        </p>
        <div className="booking-occupancy">
          <div>
            <span className={llena ? 'full' : ''}>
              {llena
                ? `Clase llena · ${clase.enEspera} ${clase.enEspera === 1 ? 'persona' : 'personas'} en espera`
                : `${clase.cuposLibres} de ${clase.aforo} cupos libres`}
            </span>
          </div>
          <div className="booking-progress">
            <i style={{ width: `${ocupacion}%` }} />
          </div>
        </div>
        {error && (
          <p className="booking-error">
            <Icono nombre="alert" tamano={14} />
            {error}
          </p>
        )}
      </div>
      <div className="booking-action">
        {reserva ? (
          <>
            <Badge tono={TONO_RESERVA[reserva.estado]}>
              {reserva.estado === 'CONFIRMADA' ? 'Reservada' : textoEstadoReserva(reserva)}
            </Badge>
            <button className="secondary-button" onClick={() => alCancelar(reserva)} disabled={enviando}>
              Cancelar
            </button>
          </>
        ) : (
          <button className="primary-button" disabled={!activa || enviando} onClick={alReservar}>
            {enviando ? 'Reservando…' : llena ? 'Unirme a la lista de espera' : 'Reservar'}
          </button>
        )}
      </div>
    </article>
  )
}
