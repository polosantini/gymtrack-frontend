import { useCallback, useState, type ReactNode } from 'react'
import { setActorActual } from '../api/client'
import { UsuarioActualContext, type UsuarioActual } from './usuarioActual'

export function UsuarioActualProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuarioEstado] = useState<UsuarioActual>({ rol: 'ADMIN' })
  // Al cambiar de actor se actualizan también los headers X-Role / X-User-Id del cliente HTTP
  const setUsuario = useCallback((u: UsuarioActual) => {
    setActorActual(u)
    setUsuarioEstado(u)
  }, [])
  return <UsuarioActualContext.Provider value={{ usuario, setUsuario }}>{children}</UsuarioActualContext.Provider>
}
