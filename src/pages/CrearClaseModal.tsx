import { useState, type FormEvent } from 'react'
import { clasesApi } from '../api/clases'
import type { Clase, DiaSemana } from '../api/types'
import { AccionesModal, AlertaFormulario, Campo, Modal } from '../components/ui'
import { DIAS, mensajeDe } from '../utils/formato'

const VACIO = { nombre: '', instructor: '', hora: '', duracionMinutos: '60', aforo: '12', sala: '' }
type Valores = typeof VACIO
type Errores = Partial<Record<keyof Valores | 'dias', string>>

function validar(v: Valores, dias: DiaSemana[]): Errores {
  const e: Errores = {}
  const duracion = Number(v.duracionMinutos)
  const aforo = Number(v.aforo)
  if (!v.nombre.trim()) e.nombre = 'El nombre es obligatorio.'
  if (!v.instructor.trim()) e.instructor = 'El instructor es obligatorio.'
  if (dias.length === 0) e.dias = 'Selecciona al menos un día.'
  if (!v.hora) e.hora = 'La hora de inicio es obligatoria.'
  if (!Number.isInteger(duracion) || duracion < 1 || duracion > 240) e.duracionMinutos = 'Ingresa un valor entre 1 y 240.'
  if (!Number.isInteger(aforo) || aforo < 1 || aforo > 200) e.aforo = 'Ingresa un valor entre 1 y 200.'
  if (!v.sala.trim()) e.sala = 'La sala es obligatoria.'
  return e
}

export function CrearClaseModal({ alCerrar, alCrear }: { alCerrar: () => void; alCrear: (c: Clase) => void }) {
  const [valores, setValores] = useState(VACIO)
  const [dias, setDias] = useState<DiaSemana[]>([])
  const [errores, setErrores] = useState<Errores>({})
  const [errorApi, setErrorApi] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cambiar = (campo: keyof Valores, valor: string) => {
    setValores((v) => ({ ...v, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: undefined }))
    setErrorApi('')
  }

  const alternarDia = (dia: DiaSemana) => {
    setDias((d) => (d.includes(dia) ? d.filter((x) => x !== dia) : [...d, dia]))
    setErrores((e) => ({ ...e, dias: undefined }))
  }

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    const nuevosErrores = validar(valores, dias)
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    setEnviando(true)
    try {
      const clase = await clasesApi.crear({
        nombre: valores.nombre.trim(),
        instructor: valores.instructor.trim(),
        // En el orden de la semana, sin importar el orden en que se marcaron
        dias: DIAS.map((d) => d.valor).filter((d) => dias.includes(d)),
        hora: valores.hora,
        duracionMinutos: Number(valores.duracionMinutos),
        aforo: Number(valores.aforo),
        sala: valores.sala.trim(),
      })
      alCrear(clase)
    } catch (err) {
      setErrorApi(mensajeDe(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal titulo="Crear clase" alCerrar={alCerrar}>
      <form onSubmit={enviar} noValidate>
        {errorApi && <AlertaFormulario mensaje={errorApi} />}
        <div className="form-grid">
          <Campo etiqueta="Nombre" obligatorio error={errores.nombre}>
            <input autoFocus value={valores.nombre} onChange={(e) => cambiar('nombre', e.target.value)} placeholder="Nombre de la clase" maxLength={80} />
          </Campo>
          <Campo etiqueta="Instructor" obligatorio error={errores.instructor}>
            <input value={valores.instructor} onChange={(e) => cambiar('instructor', e.target.value)} placeholder="Nombre del instructor" maxLength={120} />
          </Campo>
          <div className={`field day-field ${errores.dias ? 'field-error' : ''}`}>
            <span>
              Días de la semana <b>*</b>
            </span>
            <div className="day-picker">
              {DIAS.map((d) => (
                <button
                  type="button"
                  key={d.valor}
                  className={dias.includes(d.valor) ? 'selected' : ''}
                  aria-pressed={dias.includes(d.valor)}
                  onClick={() => alternarDia(d.valor)}
                >
                  {d.corto}
                </button>
              ))}
            </div>
            {errores.dias && <em>{errores.dias}</em>}
          </div>
          <div className="two-column">
            <Campo etiqueta="Hora de inicio" obligatorio error={errores.hora}>
              <input type="time" value={valores.hora} onChange={(e) => cambiar('hora', e.target.value)} />
            </Campo>
            <Campo etiqueta="Duración en minutos" obligatorio error={errores.duracionMinutos}>
              <input type="number" min={1} max={240} value={valores.duracionMinutos} onChange={(e) => cambiar('duracionMinutos', e.target.value)} />
            </Campo>
          </div>
          <div className="two-column">
            <Campo etiqueta="Aforo máximo" obligatorio error={errores.aforo}>
              <input type="number" min={1} max={200} value={valores.aforo} onChange={(e) => cambiar('aforo', e.target.value)} />
            </Campo>
            <Campo etiqueta="Sala" obligatorio error={errores.sala}>
              <input value={valores.sala} onChange={(e) => cambiar('sala', e.target.value)} placeholder="Ej. Sala Ciclo" maxLength={60} />
            </Campo>
          </div>
        </div>
        <AccionesModal alCerrar={alCerrar} enviando={enviando} />
      </form>
    </Modal>
  )
}
