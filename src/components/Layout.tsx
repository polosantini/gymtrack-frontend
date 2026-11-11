import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { miembrosApi } from '../api/miembros'
import { useUsuarioActual } from '../context/usuarioActual'
import { useCarga } from '../hooks/useCarga'
import { iniciales, NOMBRE_ESTADO_MEMBRESIA, NOMBRE_PLAN } from '../utils/formato'
import { Icono, type NombreIcono } from './Icono'

interface ItemMenu {
  ruta: string
  texto: string
  icono: NombreIcono
}

const MENU_ADMIN: ItemMenu[] = [
  { ruta: '/miembros', texto: 'Miembros', icono: 'users' },
  { ruta: '/clases', texto: 'Clases', icono: 'calendar' },
  { ruta: '/pagos', texto: 'Pagos', icono: 'card' },
]

// Notificaciones entra al menú en la Fase 3 (#36); la ruta /notificaciones ya existe.
const MENU_MIEMBRO: ItemMenu[] = [
  { ruta: '/reservar', texto: 'Reservar clases', icono: 'calendar' },
  { ruta: '/mis-reservas', texto: 'Mis reservas', icono: 'list' },
  { ruta: '/mi-membresia', texto: 'Mi membresía', icono: 'card' },
]

export function Layout() {
  const { usuario, setUsuario } = useUsuarioActual()
  const miembros = useCarga(() => miembrosApi.listar())
  const navegar = useNavigate()
  const esAdmin = usuario.rol === 'ADMIN'
  const menu = esAdmin ? MENU_ADMIN : MENU_MIEMBRO
  const nombre = esAdmin ? 'Administrador' : usuario.nombre
  const membresia = esAdmin ? null : miembros.datos?.find((m) => m.id === usuario.miembroId)?.membresia
  const detalle = esAdmin
    ? 'Panel de gestión'
    : !membresia
      ? 'Sin membresía'
      : membresia.estado === 'ACTIVA'
        ? `Plan ${NOMBRE_PLAN[membresia.plan]}`
        : `Membresía ${NOMBRE_ESTADO_MEMBRESIA[membresia.estado].toLowerCase()}`

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
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">G</span>
          <span>GymTrack</span>
        </div>
        <div className="actor">
          <label htmlFor="actor">Actuar como</label>
          <select id="actor" value={esAdmin ? 'ADMIN' : usuario.miembroId} onChange={(e) => cambiar(e.target.value)}>
            <option value="ADMIN">Administrador</option>
            {miembros.datos?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>
        <nav aria-label="Navegación principal">
          <p>{esAdmin ? 'GESTIÓN' : 'MI ESPACIO'}</p>
          {menu.map((item) => (
            <NavLink key={item.ruta} to={item.ruta} className={({ isActive }) => (isActive ? 'active' : '')}>
              <Icono nombre={item.icono} tamano={19} />
              {item.texto}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span>{esAdmin ? 'GT' : iniciales(nombre)}</span>
          <div>
            <strong>{nombre}</strong>
            <small>{detalle}</small>
          </div>
        </div>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
