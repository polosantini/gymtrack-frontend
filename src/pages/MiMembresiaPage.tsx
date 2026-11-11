import { miembrosApi } from '../api/miembros'
import { TarjetaAcceso, TarjetaMembresia } from '../components/Membresia'
import { ErrorConexion, EsqueletoTabla, PageHeader } from '../components/ui'
import { useUsuarioActual } from '../context/usuarioActual'
import { useCarga } from '../hooks/useCarga'
import { REGLA_PLAN } from '../utils/formato'
import { AvisoElegirMiembro } from './ReservarPage'

/** Vista del miembro: su membresía actual y si puede reservar (GET /api/miembros/{id} + /acceso). */
export function MiMembresiaPage() {
  const { usuario } = useUsuarioActual()
  if (usuario.rol !== 'MIEMBRO') return <AvisoElegirMiembro titulo="Mi membresía" />
  return <MiMembresia miembroId={usuario.miembroId} />
}

function MiMembresia({ miembroId }: { miembroId: number }) {
  const { datos, cargando, error, recargar } = useCarga(async () => {
    const [miembro, acceso] = await Promise.all([miembrosApi.obtener(miembroId), miembrosApi.acceso(miembroId)])
    return { miembro, acceso }
  }, [miembroId])

  return (
    <>
      <PageHeader titulo="Mi membresía" contexto="Área de miembro" />
      {error ? (
        <ErrorConexion mensaje={error} reintentar={recargar} />
      ) : cargando || !datos ? (
        <section className="panel">
          <EsqueletoTabla />
        </section>
      ) : (
        <div className="membership-page-grid">
          <TarjetaMembresia membresia={datos.miembro.membresia} />
          <TarjetaAcceso
            acceso={datos.acceso}
            textoActiva={datos.acceso.plan ? `Tu plan permite ${REGLA_PLAN[datos.acceso.plan]}.` : 'Tu membresía está activa.'}
            textoInactiva={
              datos.miembro.membresia
                ? 'Tu membresía no está activa. No puedes reservar clases.'
                : 'No tienes una membresía. Acércate a la recepción para adquirir un plan.'
            }
          />
        </div>
      )}
    </>
  )
}
