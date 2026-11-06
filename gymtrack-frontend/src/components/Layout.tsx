import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { miembrosApi } from '../api/miembros'
import { useUsuarioActual } from '../context/usuarioActual'
import { useCarga } from '../hooks/useCarga'

const MENU_ADMIN = [
  { ruta: '/miembros', texto: 'Miembros' },
  { ruta: '/clases', texto: 'Clases' },
  { ruta: '/pagos', texto: 'Pagos' },
]

const MENU_MIEMBRO = [
  { ruta: '/reservar', texto: 'Reservar' },
  { ruta: '/mis-reservas', texto: 'Mis reservas' },
  { ruta: '/notificaciones', texto: 'Notificaciones' },
]

export function Layout() {
  const { usuario, setUsuario } = useUsuarioActual()
  const miembros = useCarga(() => miembrosApi.listar())
  const navegar = useNavigate()
  const menu = usuario.rol === 'ADMIN' ? MENU_ADMIN : MENU_MIEMBRO

  const cambiar = (valor: string) => {
    if (valor === 'ADMIN') {
      setUsuario({ rol: 'ADMIN' })
    } else {
      const m = miembros.datos?.find((x) => x.id === Number(valor))
      if (m) setUsuario({ rol: 'MIEMBRO', miembroId: m.id, nombre: m.nombre })
    }
    navegar('/') // vuelve al inicio del nuevo rol

  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1 className="marca">GymTrack</h1>
        <label className="actuar-como">
          Actuar como
          <select value={usuario.rol === 'ADMIN' ? 'ADMIN' : usuario.miembroId} onChange={(e) => cambiar(e.target.value)}>
            <option value="ADMIN">Administrador</option>
            {miembros.datos?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </label>
        <nav>
          {menu.map((item) => (
            <NavLink key={item.ruta} to={item.ruta} className={({ isActive }) => (isActive ? 'activo' : '')}>
              {item.texto}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="contenido">
        <Outlet />
      </main>
    </div>
  )
}
