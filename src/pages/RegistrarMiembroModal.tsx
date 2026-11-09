import { useState, type FormEvent } from 'react'
import { miembrosApi } from '../api/miembros'
import type { Miembro, NuevoMiembro } from '../api/types'
import { AccionesModal, AlertaFormulario, Campo, Modal } from '../components/ui'
import { mensajeDe } from '../utils/formato'

type Errores = Partial<Record<keyof NuevoMiembro, string>>

const VACIO = { nombre: '', email: '' }

function validar(v: typeof VACIO): Errores {
  const e: Errores = {}
  // Mismas reglas que MiembroRequest en el backend (@NotBlank, @Size(max = 255), @Email)
  if (!v.nombre.trim()) e.nombre = 'El nombre es obligatorio.'
  if (!v.email.trim()) e.email = 'El email es obligatorio.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = 'El email no tiene un formato válido.'
  return e
}

export function RegistrarMiembroModal({ alCerrar, alRegistrar }: { alCerrar: () => void; alRegistrar: (m: Miembro) => void }) {
  const [valores, setValores] = useState(VACIO)
  const [errores, setErrores] = useState<Errores>({})
  const [errorApi, setErrorApi] = useState('')
  const [enviando, setEnviando] = useState(false)

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

    setEnviando(true)
    try {
      const miembro = await miembrosApi.registrar({
        nombre: valores.nombre.trim(),
        email: valores.email.trim(),
      })
      alRegistrar(miembro)
    } catch (err) {
      setErrorApi(mensajeDe(err)) // ej. 409 "Ya existe un miembro con el email ..."
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
            <input autoFocus value={valores.nombre} onChange={(e) => cambiar('nombre', e.target.value)} placeholder="Ej. Laura González" maxLength={255} />
          </Campo>
          <Campo etiqueta="Email" obligatorio error={errores.email}>
            <input type="email" value={valores.email} onChange={(e) => cambiar('email', e.target.value)} placeholder="nombre@correo.com" maxLength={255} />
          </Campo>
        </div>
        <AccionesModal alCerrar={alCerrar} enviando={enviando} />
      </form>
    </Modal>
  )
}
