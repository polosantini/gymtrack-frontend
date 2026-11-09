import { useCallback, useState, type FormEvent } from 'react'
import { miembrosApi } from '../api/miembros'
import { pagosApi } from '../api/pagos'
import type { Miembro, Pago, Periodo, Plan, PlanInfo } from '../api/types'
import { Icono } from '../components/Icono'
import {
  AlertaFormulario, Badge, Campo, ErrorConexion, EsqueletoTabla, EstadoVacio, PageHeader, Toast, type Tono,
} from '../components/ui'
import { useCarga } from '../hooks/useCarga'
import {
  fecha, mensajeDe, METODOS_PAGO, NOMBRE_ESTADO_PAGO, NOMBRE_PERIODO, NOMBRE_PLAN, nombreMetodo, pesos,
} from '../utils/formato'

const TONO_PAGO: Record<string, Tono> = { REGISTRADO: 'neutral', COMPLETADO: 'green', PENDIENTE: 'amber', FALLIDO: 'red' }
const PERIODOS: Periodo[] = ['MENSUAL', 'TRIMESTRAL', 'ANUAL']

export function PagosPage() {
  const base = useCarga(async () => {
    const [miembros, planes] = await Promise.all([miembrosApi.listar(), miembrosApi.planes()])
    return { miembros, planes }
  })
  // GET /api/pagos exige miembroId: el historial es del miembro elegido en el formulario
  const [miembroId, setMiembroId] = useState(0)
  const idActual = miembroId || base.datos?.miembros[0]?.id || 0
  const pagos = useCarga(() => (idActual ? pagosApi.delMiembro(idActual) : Promise.resolve([])), [idActual])
  const [aviso, setAviso] = useState('')
  const cerrarAviso = useCallback(() => setAviso(''), [])

  const nombre = base.datos?.miembros.find((m) => m.id === idActual)?.nombre ?? ''

  const alRegistrar = (pago: Pago) => {
    if (pago.miembroId === idActual) pagos.setDatos([...(pagos.datos ?? []), pago])
    setAviso('Pago registrado. La membresía se activará en unos segundos.')
  }

  const lista = [...(pagos.datos ?? [])].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id)

  return (
    <>
      <PageHeader titulo="Pagos" />
      {base.error && <ErrorConexion mensaje={base.error} reintentar={base.recargar} />}
      {base.cargando ? (
        <section className="panel">
          <EsqueletoTabla />
        </section>
      ) : base.datos ? (
        <div className="payments-layout">
          <FormularioPago
            miembros={base.datos.miembros}
            planes={base.datos.planes}
            miembroId={idActual}
            alCambiarMiembro={setMiembroId}
            alRegistrar={alRegistrar}
          />
          <section className="panel recent-payments">
            <div className="recent-heading">
              <div>
                <h2>Pagos de {nombre || 'este miembro'}</h2>
                <p>Historial del miembro seleccionado</p>
              </div>
              <span>{lista.length} {lista.length === 1 ? 'pago' : 'pagos'}</span>
            </div>
            {pagos.error ? (
              <ErrorConexion mensaje={pagos.error} reintentar={pagos.recargar} />
            ) : pagos.cargando ? (
              <EsqueletoTabla />
            ) : lista.length > 0 ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Plan</th>
                      <th>Periodo</th>
                      <th>Monto</th>
                      <th>Método</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((p) => (
                      <tr key={p.id}>
                        <td>{fecha(p.fecha)}</td>
                        <td>{NOMBRE_PLAN[p.plan] ?? p.plan}</td>
                        <td>{NOMBRE_PERIODO[p.periodo] ?? p.periodo}</td>
                        <td className="amount">{pesos(p.monto)}</td>
                        <td>{nombreMetodo(p.metodo)}</td>
                        <td>
                          <Badge tono={TONO_PAGO[p.estado]}>{NOMBRE_ESTADO_PAGO[p.estado] ?? p.estado}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EstadoVacio texto="Este miembro aún no tiene pagos" />
            )}
          </section>
        </div>
      ) : null}
      {aviso && <Toast mensaje={aviso} alCerrar={cerrarAviso} />}
    </>
  )
}

interface PropsFormulario {
  miembros: Miembro[]
  planes: PlanInfo[]
  miembroId: number
  alCambiarMiembro: (id: number) => void
  alRegistrar: (p: Pago) => void
}

function FormularioPago({ miembros, planes, miembroId, alCambiarMiembro, alRegistrar }: PropsFormulario) {
  const precio = (plan: Plan, periodo: Periodo) => {
    const p = planes.find((x) => x.nombre === plan)
    if (!p) return 0
    return periodo === 'MENSUAL' ? p.precioMensual : periodo === 'TRIMESTRAL' ? p.precioTrimestral : p.precioAnual
  }

  const [plan, setPlan] = useState<Plan>('BASICO')
  const [periodo, setPeriodo] = useState<Periodo>('MENSUAL')
  const [monto, setMonto] = useState(String(precio('BASICO', 'MENSUAL')))
  const [metodo, setMetodo] = useState<string>(METODOS_PAGO[0])
  const [errorMonto, setErrorMonto] = useState('')
  const [errorApi, setErrorApi] = useState('')
  const [enviando, setEnviando] = useState(false)

  // El monto se recalcula con la tarifa del plan y el periodo, pero se puede editar
  const cambiarTarifa = (nuevoPlan: Plan, nuevoPeriodo: Periodo) => {
    setPlan(nuevoPlan)
    setPeriodo(nuevoPeriodo)
    setMonto(String(precio(nuevoPlan, nuevoPeriodo)))
    setErrorMonto('')
  }

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setErrorApi('')
    const valor = Number(monto)
    if (!monto || !Number.isFinite(valor) || valor <= 0) {
      setErrorMonto('El monto debe ser mayor a cero.')
      return
    }
    setEnviando(true)
    try {
      alRegistrar(await pagosApi.registrar({ miembroId, plan, periodo, monto: valor, metodo }))
    } catch (err) {
      setErrorApi(mensajeDe(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="panel payment-form-card">
      <div className="section-title">
        <span>
          <Icono nombre="card" tamano={20} />
        </span>
        <div>
          <h2>Registrar pago</h2>
          <p>Ingresa los datos de la transacción</p>
        </div>
      </div>
      <form onSubmit={enviar} noValidate>
        {errorApi && <AlertaFormulario mensaje={errorApi} />}
        <Campo etiqueta="Miembro" obligatorio>
          <select value={miembroId} onChange={(e) => alCambiarMiembro(Number(e.target.value))}>
            {miembros.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} — {m.email}
              </option>
            ))}
          </select>
        </Campo>
        <div className="two-column">
          <Campo etiqueta="Plan" obligatorio>
            <select value={plan} onChange={(e) => cambiarTarifa(e.target.value as Plan, periodo)}>
              {planes.map((p) => (
                <option key={p.nombre} value={p.nombre}>
                  {NOMBRE_PLAN[p.nombre] ?? p.nombre}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Periodo" obligatorio>
            <select value={periodo} onChange={(e) => cambiarTarifa(plan, e.target.value as Periodo)}>
              {PERIODOS.map((p) => (
                <option key={p} value={p}>
                  {NOMBRE_PERIODO[p]}
                </option>
              ))}
            </select>
          </Campo>
        </div>
        <Campo etiqueta="Monto" obligatorio error={errorMonto}>
          <div className="money-input">
            <span>$</span>
            <input
              aria-label="Monto en pesos colombianos"
              type="number"
              min={1}
              step={100}
              value={monto}
              onChange={(e) => {
                setMonto(e.target.value)
                setErrorMonto('')
              }}
            />
            <small>COP</small>
          </div>
        </Campo>
        <Campo etiqueta="Método de pago" obligatorio>
          <select value={metodo} onChange={(e) => setMetodo(e.target.value)}>
            {METODOS_PAGO.map((m) => (
              <option key={m} value={m}>
                {nombreMetodo(m)}
              </option>
            ))}
          </select>
        </Campo>
        <button className="primary-button payment-submit" type="submit" disabled={enviando || miembros.length === 0}>
          {enviando ? 'Registrando…' : 'Registrar pago'}
        </button>
      </form>
    </section>
  )
}
