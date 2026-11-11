# GymTrack — Frontend

React + TypeScript + Vite. Responsable: persona C.

## Ejecutar

```bash
npm install
npm run dev
```

Abre http://localhost:5173.

- `VITE_USAR_MOCK=true` en `.env` usa los datos simulados de `src/api/mock/datos.ts`.
- `VITE_USAR_MOCK=false` llama al backend real. El proxy de `vite.config.ts` manda `/api/miembros` y `/api/planes` al puerto 8081, `/api/clases` y `/api/reservas` al 8082, y `/api/pagos` y `/api/notificaciones` al 8083.

### Probar los estados con datos simulados

Agrega a la URL:

- `?simular-error`: todas las llamadas fallan con "No hay conexión con el servidor" (ej. http://localhost:5173/miembros?simular-error)
- `?simular-lento`: las respuestas tardan 3 segundos, para ver los esqueletos de carga

Registrar un miembro con el email `ana@test.com` devuelve el 409 "Ya existe un miembro con el email ana@test.com".

Los datos simulados copian los `data.sql` del backend (7 miembros; Spinning, Yoga y Funcional con sus reservas; los pagos) y siguen el shape real de cada endpoint (ver `src/api/types.ts`). Los errores se leen del campo `message` del formato uniforme `{timestamp, status, error, message, path}`.

### Pantallas

| Rol (selector "Actuar como") | Pantallas |
|---|---|
| Administrador | Miembros (lista, registro y detalle en `/miembros/:id`), Clases, Pagos |
| Miembro | Reservar clases, Mis reservas, Mi membresía |

Miembros de demo para probar las reglas de reserva:

| Miembro | Plan | Estado | Qué se prueba |
|---|---|---|---|
| Diego | Básico | Activa | 3.ª reserva de la semana rechazada; está en la espera de Spinning del 17 |
| Luis | Full | Activa | 2.ª reserva del mismo día rechazada |
| María | Premium | Activa | Sin límite; Spinning del 17 lleno → lista de espera |
| Ana, Sara | Básico, Premium | Suspendida | "La membresía no está activa" |
| Carlos | Full | Vencida | Sin acceso |
| Pedro | — | Sin membresía | Sin acceso |

Las reservas simuladas aplican las mismas reglas que el backend (membresía activa, fecha de la clase, reserva repetida, regla del plan, aforo y lista de espera). Cancelar todavía no pasa el cupo al siguiente en espera: eso llega con la Fase 3.

## Scripts

- `npm run dev`: servidor de desarrollo
- `npm run lint`: revisión con oxlint
- `npm run build`: verifica tipos y compila (lo mismo que corre la CI)

## Estructura

```text
src/
├── api/          cliente HTTP, tipos del contrato, un módulo por servicio y datos simulados
├── components/   Layout (menú + selector "actuar como") y mensajes de carga/error
├── context/      usuario actual (administrador o un miembro)
├── hooks/        useCarga
└── pages/        una página por pantalla
```
