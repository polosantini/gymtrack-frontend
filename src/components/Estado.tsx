import { ErrorConexion, EsqueletoTabla } from './ui'

export function Cargando() {
  return <EsqueletoTabla />
}

export function ErrorCarga({ mensaje, reintentar }: { mensaje: string; reintentar: () => void }) {
  return <ErrorConexion mensaje={mensaje} reintentar={reintentar} />
}
