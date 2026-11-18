import { useCallback, useEffect, useState } from 'react'

/** Carga datos asíncronos y expone cargando / error / recargar. */
export function useCarga<T>(cargar: () => Promise<T>, deps: unknown[] = []) {
  const [datos, setDatos] = useState<T>()
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /** Vuelve a cargar; devuelve true si salió bien. */
  const recargar = useCallback(async (): Promise<boolean> => {
    setCargando(true)
    setError(null)
    try {
      setDatos(await cargar())
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
      return false
    } finally {
      setCargando(false)
    }
    // Las dependencias las define quien llama al hook (ej. [miembroId])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    void recargar()
  }, [recargar])

  return { datos, cargando, error, recargar, setDatos }
}
