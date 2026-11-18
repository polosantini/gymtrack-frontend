import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { useUsuarioActual } from './context/usuarioActual'
import { ClasesPage } from './pages/ClasesPage'
import { MiembroDetallePage } from './pages/MiembroDetallePage'
import { MiembrosPage } from './pages/MiembrosPage'
import { MiMembresiaPage } from './pages/MiMembresiaPage'
import { MisReservasPage } from './pages/MisReservasPage'
import { NotificacionesPage } from './pages/NotificacionesPage'
import { PagosPage } from './pages/PagosPage'
import { ReservarPage } from './pages/ReservarPage'

/** Pantallas de gestión: un miembro que entre por URL vuelve a su inicio (etiqueta visual, no es seguridad). */
function SoloAdmin({ children }: { children: ReactNode }) {
  const { usuario } = useUsuarioActual()
  return usuario.rol === 'ADMIN' ? children : <Navigate to="/reservar" replace />
}

export default function App() {
  const { usuario } = useUsuarioActual()
  const inicio = usuario.rol === 'ADMIN' ? '/miembros' : '/reservar'
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to={inicio} replace />} />
        <Route path="miembros" element={<SoloAdmin><MiembrosPage /></SoloAdmin>} />
        <Route path="miembros/:id" element={<SoloAdmin><MiembroDetallePage /></SoloAdmin>} />
        <Route path="clases" element={<SoloAdmin><ClasesPage /></SoloAdmin>} />
        <Route path="pagos" element={<SoloAdmin><PagosPage /></SoloAdmin>} />
        <Route path="reservar" element={<ReservarPage />} />
        <Route path="mis-reservas" element={<MisReservasPage />} />
        <Route path="mi-membresia" element={<MiMembresiaPage />} />
        <Route path="notificaciones" element={<NotificacionesPage />} />
        <Route path="*" element={<Navigate to={inicio} replace />} />
      </Route>
    </Routes>
  )
}
