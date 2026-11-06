// Cliente HTTP común. Todas las llamadas al backend pasan por aquí.

// Por defecto usa datos simulados; con VITE_USAR_MOCK=false en el .env llama al backend real
export const USAR_MOCK = import.meta.env.VITE_USAR_MOCK !== 'false'

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
      headers: cuerpo !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    })
  } catch {
    throw new ApiError(0, 'No hay conexión con el servidor')
  }

  if (!respuesta.ok) {
    // El backend responde los errores como {"mensaje": "..."}
    let mensaje = `Error ${respuesta.status}`
    try {
      const datos = (await respuesta.json()) as { mensaje?: string }
      if (datos.mensaje) mensaje = datos.mensaje
    } catch {
      // la respuesta no traía JSON
    }
    throw new ApiError(respuesta.status, mensaje)
  }

  if (respuesta.status === 204) return undefined as T
  return (await respuesta.json()) as T
}

/** Devuelve datos simulados con un pequeño retraso, como si vinieran del servidor. */
export function simular<T>(datos: T, ms = 300): Promise<T> {
  return new Promise((resolver) => setTimeout(() => resolver(structuredClone(datos)), ms))
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
