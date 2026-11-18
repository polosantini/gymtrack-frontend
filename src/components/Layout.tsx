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

const MENU_MIEMBRO: ItemMenu[] = [
  { ruta: '/reservar', texto: 'Reservar clases', icono: 'calendar' },
  { ruta: '/mis-reservas', texto: 'Mis reservas', icono: 'list' },
  { ruta: '/mi-membresia', texto: 'Mi membresía', icono: 'card' },
  { ruta: '/notificaciones', texto: 'Notificaciones', icono: 'bell' },
]

export function Layout() {
  const { usuario, setUsuario } = useUsuarioActual()
  // Se recarga al cambiar de actor: así el plan y el estado del pie reflejan pagos recientes
  const miembros = useCarga(() => miembrosApi.listar(), [usuario])
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

  const elegirMiembro = (id: number) => {
    const m = miembros.datos?.find((x) => x.id === id)
    if (!m) return
    setUsuario({ rol: 'MIEMBRO', miembroId: m.id, nombre: m.nombre })
    navegar('/reservar')
  }

  const cambiarRol = (rol: string) => {
    if (rol === 'ADMIN') {
      setUsuario({ rol: 'ADMIN' })
      navegar('/miembros')
    } else if (miembros.datos?.length) {
      elegirMiembro(miembros.datos[0].id) // por defecto el primero; se cambia en el segundo selector
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">G</span>
          <span>GymTrack</span>
        </div>
        <div className="actor">
          <label htmlFor="actor-rol">Actuar como</label>
          <select id="actor-rol" value={esAdmin ? 'ADMIN' : 'MIEMBRO'} onChange={(e) => cambiarRol(e.target.value)}>
            <option value="ADMIN">Administrador</option>
            <option value="MIEMBRO" disabled={!miembros.datos?.length}>
              Miembro
            </option>
          </select>
          {!esAdmin && (
            <select
              id="actor-miembro"
              aria-label="Miembro"
              value={usuario.miembroId}
              onChange={(e) => elegirMiembro(Number(e.target.value))}
            >
              {miembros.datos?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          )}
          {/* Etiqueta para la demo: lo que viaja en cada petición (el backend lo ignora) */}
          <small className="actor-context">
            X-Role: {esAdmin ? 'ADMIN' : `MEMBER · X-User-Id: ${usuario.miembroId}`}
          </small>
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
