# GymTrack — Frontend

React + TypeScript + Vite. Responsable: persona C.

## Ejecutar

```bash
npm install
npm run dev
```

Abre http://localhost:5173.

- Por defecto (sin `.env`, o con `VITE_USAR_MOCK=false`) la app llama al backend real. El proxy de `vite.config.ts` manda `/api/miembros`, `/api/planes` y `/api/membresias` al puerto 8081, `/api/clases` y `/api/reservas` al 8082, y `/api/pagos` y `/api/notificaciones` al 8083.
- `VITE_USAR_MOCK=true` en `.env` usa los datos simulados de `src/api/mock/datos.ts` (sirve para trabajar sin levantar el backend).

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
| Miembro | Reservar clases, Mis reservas, Mi membresía, Notificaciones |

El selector "Actuar como" tiene dos listas: el rol (Administrador o Miembro) y, si es miembro, cuál. Cada petición lleva los headers `X-Role: ADMIN|MEMBER` y `X-User-Id: <id>`; el backend los ignora, son solo una etiqueta para la demo (no hay JWT ni autorización real). Un miembro que entre por URL a una pantalla de gestión vuelve a "Reservar clases".

### Los 3 flujos de mensajería en la interfaz (Fase 3)

| Flujo | Cómo verlo |
|---|---|
| `pago.registrado` | Como administrador, en Pagos registra un pago para Ana → la membresía pasa a ACTIVA y, como Ana, en Notificaciones aparece "Pago confirmado". |
| `membresia.proxima.vencer` | Como administrador, en Miembros pulsa "Procesar vencimientos" → como Diego (vence en 3 días), en Notificaciones aparece "Tu membresía está por vencer". |
| `reserva.cancelada` → `reserva.cupo.asignado` | Como Luis, cancela Spinning del martes 17 → como Diego (estaba en espera), su reserva pasa a confirmada y en Notificaciones aparece "Se liberó un cupo para ti". |

Los eventos viajan por RabbitMQ, así que el resultado aparece un momento después: usa "Actualizar" en Notificaciones o vuelve a entrar a la pantalla.

Miembros de demo para probar las reglas de reserva:

| Miembro | Plan | Estado | Qué se prueba |
|---|---|---|---|
| Diego | Básico | Activa (vence en 3 días) | 3.ª reserva de la semana rechazada; está en la espera de Spinning del 17; alerta de vencimiento |
| Luis | Full | Activa | 2.ª reserva del mismo día rechazada |
| María | Premium | Activa | Sin límite; Spinning del 17 lleno → lista de espera |
| Ana, Sara | Básico, Premium | Suspendida | "La membresía no está activa" |
| Carlos | Full | Vencida | Sin acceso |
| Pedro | — | Sin membresía | Sin acceso |

Con `VITE_USAR_MOCK=true` los datos simulados aplican las mismas reglas que el backend (membresía activa, fecha de la clase, reserva repetida, regla del plan, aforo y lista de espera) y simulan los 3 flujos de mensajería con un pequeño retraso.

## Scripts

- `npm run dev`: servidor de desarrollo
- `npm run lint`: revisión con oxlint
- `npm run build`: verifica tipos y compila (lo mismo que corre la CI)

## Docker

En producción no hay servidor de Vite: la aplicación se compila y la sirve **nginx**, que además
reparte `/api` entre los tres microservicios (lo que en desarrollo hace el proxy de `vite.config.ts`).

```bash
docker build -t gymtrack-frontend .
docker run --rm -p 3000:80 gymtrack-frontend
```

Abre http://localhost:3000. Con `docker run` suelto no hay backend al que llamar, así que las
pantallas mostrarán "No hay conexión con el servidor"; para ver datos hay que levantarlo todo junto
(ver abajo) o construir una imagen con datos simulados:

```bash
docker build --build-arg USAR_MOCK=true -t gymtrack-frontend:mock .
```

`VITE_USAR_MOCK` se resuelve **al construir la imagen**, no al ejecutarla, porque Vite reemplaza esas
variables durante la compilación. Las direcciones de los servicios sí se leen al arrancar el
contenedor, así que se pueden cambiar sin reconstruir:

| Variable | Valor por defecto |
|---|---|
| `MIEMBROS_URL` | `http://miembros-service:8081` |
| `CLASES_URL` | `http://clases-service:8082` |
| `PAGOS_URL` | `http://pagos-service:8083` |

### Publicación automática (CD)

`.github/workflows/cd.yml` compila y publica la imagen en GHCR como
`ghcr.io/polosantini/gymtrack-frontend:latest` (y una etiqueta con el commit). Solo corre al fusionar
en `main` y únicamente publica si `npm run lint` y `npm run build` pasan.

El paquete nace privado: para que el equipo pueda descargarlo sin iniciar sesión, en la página del
paquete en GitHub hay que cambiarlo a público, o usar `docker login ghcr.io`.

### Arrancar la demo completa

El `docker-compose.yml` del backend levanta Postgres, RabbitMQ y los tres servicios. El frontend se
agrega como un servicio más:

```yaml
  frontend:
    image: ghcr.io/polosantini/gymtrack-frontend:latest
    container_name: gymtrack-frontend
    ports:
      - "3000:80"
    depends_on:
      - miembros-service
      - clases-service
      - pagos-service
```

Si los servicios del backend quedan con otros nombres, se corrigen aquí sin tocar la imagen:

```yaml
    environment:
      MIEMBROS_URL: http://otro-nombre:8081
```

Procedimiento de la demo:

```bash
docker compose pull
docker compose up -d
```

La aplicación queda en http://localhost:3000 y RabbitMQ en http://localhost:15672. Para el paso 6
(disponibilidad), `docker compose stop pagos-service`: Clases y Reservas siguen funcionando y solo
las pantallas de Pagos y Notificaciones muestran el error de conexión.

## Estructura

```text
src/
├── api/          cliente HTTP, tipos del contrato, un módulo por servicio y datos simulados
├── components/   Layout (menú + selector "actuar como") y mensajes de carga/error
├── context/      usuario actual (administrador o un miembro)
├── hooks/        useCarga
└── pages/        una página por pantalla
```
