import { createContext, useContext } from 'react'

// Sin login: el selector "actuar como" decide si la app se ve como administrador o como un miembro.
export type UsuarioActual = { rol: 'ADMIN' } | { rol: 'MIEMBRO'; miembroId: number; nombre: string }

export interface ValorUsuarioActual {
  usuario: UsuarioActual
  setUsuario: (u: UsuarioActual) => void
}

export const UsuarioActualContext = createContext<ValorUsuarioActual | null>(null)

export function useUsuarioActual(): ValorUsuarioActual {
  const valor = useContext(UsuarioActualContext)
  if (!valor) throw new Error('useUsuarioActual debe usarse dentro de UsuarioActualProvider')
  return valor
}
