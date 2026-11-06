import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { useUsuarioActual } from './context/usuarioActual'
import { ClasesPage } from './pages/ClasesPage'
import { MiembrosPage } from './pages/MiembrosPage'
import { MisReservasPage } from './pages/MisReservasPage'
import { NotificacionesPage } from './pages/NotificacionesPage'
import { PagosPage } from './pages/PagosPage'
import { ReservarPage } from './pages/ReservarPage'

export default function App() {
  const { usuario } = useUsuarioActual()
  const inicio = usuario.rol === 'ADMIN' ? '/miembros' : '/reservar'
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to={inicio} replace />} />
        <Route path="miembros" element={<MiembrosPage />} />
        <Route path="clases" element={<ClasesPage />} />
        <Route path="pagos" element={<PagosPage />} />
        <Route path="reservar" element={<ReservarPage />} />
        <Route path="mis-reservas" element={<MisReservasPage />} />
        <Route path="notificaciones" element={<NotificacionesPage />} />
        <Route path="*" element={<Navigate to={inicio} replace />} />
      </Route>
    </Routes>
  )
}
