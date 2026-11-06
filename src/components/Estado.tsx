// Mensajes de carga y error reutilizables por todas las páginas.
export function Cargando() {
  return <p className="muted">Cargando…</p>
}

export function ErrorCarga({ mensaje, reintentar }: { mensaje: string; reintentar: () => void }) {
  return (
    <p className="error">
      {mensaje} <button onClick={reintentar}>Reintentar</button>
    </p>
  )
}
