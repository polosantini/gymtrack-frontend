import { useState, type ReactNode } from 'react'
import { UsuarioActualContext, type UsuarioActual } from './usuarioActual'

export function UsuarioActualProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioActual>({ rol: 'ADMIN' })
  return <UsuarioActualContext.Provider value={{ usuario, setUsuario }}>{children}</UsuarioActualContext.Provider>
}
