// Cliente HTTP común. Todas las llamadas al backend pasan por aquí.
import type { ErrorApi } from './types'

// Por defecto llama al backend real (Fase 3, #36). Con VITE_USAR_MOCK=true en el .env usa los datos simulados.
export const USAR_MOCK = import.meta.env.VITE_USAR_MOCK === 'true'

// ---------- Selector "actuar como" (alcance mínimo, no es JWT) ----------
// Cada petición lleva X-Role (ADMIN | MEMBER) y, si es un miembro, X-User-Id.
// El backend ignora estos headers: solo identifican quién actúa en la demo.
let cabecerasDeRol: Record<string, string> = { 'X-Role': 'ADMIN' }

export function setActorActual(actor: { rol: 'ADMIN' } | { rol: 'MIEMBRO'; miembroId: number }) {
  cabecerasDeRol =
    actor.rol === 'ADMIN' ? { 'X-Role': 'ADMIN' } : { 'X-Role': 'MEMBER', 'X-User-Id': String(actor.miembroId) }
}

export function cabecerasActuales(): Record<string, string> {
  return { ...cabecerasDeRol }
}

export class ApiError extends Error {
  status: number

  constructor(status: number, mensaje: string) {
    super(mensaje)
    this.status = status
  }
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH'

export async function pedir<T>(ruta: string, metodo: Metodo = 'GET', cuerpo?: unknown): Promise<T> {
  let respuesta: Response
  try {
    respuesta = await fetch(ruta, {
      method: metodo,
      headers: {
        ...cabecerasDeRol,
        ...(cuerpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    })
  } catch {
    throw new ApiError(0, 'No hay conexión con el servidor')
  }

  if (!respuesta.ok) {
    // Los tres servicios responden {timestamp, status, error, message, path} (contrato #8, sección 5)
    let mensaje = mensajePorEstado(respuesta.status)
    try {
      const datos = (await respuesta.json()) as Partial<ErrorApi>
      if (datos.message) mensaje = datos.message
    } catch {
      // la respuesta no traía JSON
    }
    throw new ApiError(respuesta.status, mensaje)
  }

  if (respuesta.status === 204) return undefined as T
  return (await respuesta.json()) as T
}

function mensajePorEstado(status: number): string {
  if (status === 400) return 'Los datos enviados no son válidos'
  if (status === 404) return 'No encontramos lo que buscabas'
  if (status === 409) return 'La operación entra en conflicto con los datos existentes'
  // Sin cuerpo JSON y con 5xx suele ser el proxy de Vite (o nginx) sin poder llegar al servicio
  if (status >= 500) return 'No hay conexión con el servidor'
  return `Error ${status}`
}

// ---------- Simulación (solo con USAR_MOCK) ----------
// Para demostrar los estados en la sustentación, agrega a la URL:
//   ?simular-error  → todas las llamadas fallan con "No hay conexión con el servidor"
//   ?simular-lento  → las respuestas tardan 3 segundos (se ven los esqueletos de carga)

function bandera(nombre: string): boolean {
  return new URLSearchParams(window.location.search).has(nombre)
}

/** Devuelve datos simulados con un pequeño retraso, como si vinieran del servidor. */
export function simular<T>(datos: T, ms = 300): Promise<T> {
  const espera = bandera('simular-lento') ? 3000 : ms
  return new Promise((resolver, rechazar) =>
    setTimeout(() => {
      if (bandera('simular-error')) rechazar(new ApiError(0, 'No hay conexión con el servidor'))
      else resolver(structuredClone(datos))
    }, espera),
  )
}

/** Simula una respuesta de error del backend (código HTTP + su "message"). */
export function simularError(status: number, mensaje: string, ms = 300): Promise<never> {
  return new Promise((_, rechazar) => setTimeout(() => rechazar(new ApiError(status, mensaje)), ms))
}

/** Construye "?a=1&b=2" ignorando los valores vacíos. */
export function qs(params: Record<string, string | number | undefined>): string {
  const p = new URLSearchParams()
  for (const [clave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== '') p.set(clave, String(valor))
  }
  const texto = p.toString()
  return texto ? `?${texto}` : ''
}
