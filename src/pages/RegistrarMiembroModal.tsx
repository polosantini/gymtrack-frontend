import { useState, type FormEvent } from 'react'
import { miembrosApi } from '../api/miembros'
import type { Miembro, NuevoMiembro, Plan } from '../api/types'
import { AccionesModal, AlertaFormulario, Campo, Modal } from '../components/ui'
import { mensajeDe, NOMBRE_PLAN } from '../utils/formato'

type Errores = Partial<Record<keyof NuevoMiembro | 'plan', string>>

const VACIO = { nombre: '', email: '', plan: '' as Plan | '' }
const PLANES: Plan[] = ['BASICO', 'FULL', 'PREMIUM']

function validar(v: typeof VACIO): Errores {
  const e: Errores = {}
  // Mismas reglas que MiembroRequest en el backend (@NotBlank, @Size(max = 255), @Email)
  if (!v.nombre.trim()) e.nombre = 'El nombre es obligatorio.'
  if (!v.email.trim()) e.email = 'El email es obligatorio.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = 'El email no tiene un formato válido.'
  if (!v.plan) e.plan = 'El plan es obligatorio.'
  return e
}

/**
 * Registrar un miembro son dos llamadas al backend, no una:
 *   1. POST /api/miembros                    → crea el miembro, sin membresía
 *   2. POST /api/miembros/{id}/membresias    → crea la membresía, nace SUSPENDIDA
 * Si solo se hiciera la primera, el miembro quedaría sin membresía: Pagos aceptaría su
 * pago, Miembros descartaría el evento al no encontrar membresía que activar y el miembro
 * seguiría sin acceso. Por eso el plan es obligatorio aquí.
 *
 * Si la primera llamada pasa y la segunda falla, el miembro ya existe: no se reintenta
 * la creación (daría 409 por email repetido), solo la membresía.
 */
export function RegistrarMiembroModal({ alCerrar, alRegistrar }: { alCerrar: () => void; alRegistrar: (m: Miembro) => void }) {
  const [valores, setValores] = useState(VACIO)
  const [errores, setErrores] = useState<Errores>({})
  const [errorApi, setErrorApi] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [creado, setCreado] = useState<Miembro | null>(null)

  const cambiar = (campo: keyof typeof VACIO, valor: string) => {
    setValores((v) => ({ ...v, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: undefined }))
    setErrorApi('')
  }

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    const nuevosErrores = validar(valores)
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return
    const plan = valores.plan as Plan

    setEnviando(true)
    setErrorApi('')
    try {
      const miembro = creado ?? await miembrosApi.registrar({
        nombre: valores.nombre.trim(),
        email: valores.email.trim(),
      })
      setCreado(miembro) // si falla el paso 2, el reintento no vuelve a crear el miembro
      const membresia = await miembrosApi.crearMembresia(miembro.id, plan)
      alRegistrar({ ...miembro, membresia })
    } catch (err) {
      setErrorApi(
        creado
          ? `${mensajeDe(err)} El miembro ya quedó creado sin membresía: reintenta para asignarle el plan ${NOMBRE_PLAN[plan]}.`
          : mensajeDe(err), // ej. 409 "Ya existe un miembro con el email ..."
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal titulo="Registrar miembro" alCerrar={alCerrar}>
      <form onSubmit={enviar} noValidate>
        {errorApi && <AlertaFormulario mensaje={errorApi} />}
        <div className="form-stack">
          <Campo etiqueta="Nombre completo" obligatorio error={errores.nombre}>
            <input
              autoFocus
              value={valores.nombre}
              onChange={(e) => cambiar('nombre', e.target.value)}
              placeholder="Ej. Laura González"
              maxLength={255}
              disabled={creado !== null}
            />
          </Campo>
          <Campo etiqueta="Email" obligatorio error={errores.email}>
            <input
              type="email"
              value={valores.email}
              onChange={(e) => cambiar('email', e.target.value)}
              placeholder="nombre@correo.com"
              maxLength={255}
              disabled={creado !== null}
            />
          </Campo>
          <Campo etiqueta="Plan" obligatorio error={errores.plan}>
            <select value={valores.plan} onChange={(e) => cambiar('plan', e.target.value)}>
              <option value="">Selecciona un plan</option>
              {PLANES.map((p) => (
                <option key={p} value={p}>
                  {NOMBRE_PLAN[p]}
                </option>
              ))}
            </select>
          </Campo>
          <p className="form-hint">La membresía nace suspendida y se activa con el primer pago.</p>
        </div>
        <AccionesModal alCerrar={alCerrar} enviando={enviando} />
      </form>
    </Modal>
  )
}
