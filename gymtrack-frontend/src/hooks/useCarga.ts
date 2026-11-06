import { useCallback, useEffect, useState } from 'react'

/** Carga datos asíncronos y expone cargando / error / recargar. */
export function useCarga<T>(cargar: () => Promise<T>, deps: unknown[] = []) {
  const [datos, setDatos] = useState<T>()
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const recargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      setDatos(await cargar())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setCargando(false)
    }
    // Las dependencias las define quien llama al hook (ej. [miembroId])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    void recargar()
  }, [recargar])

  return { datos, cargando, error, recargar }
}
