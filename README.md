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
