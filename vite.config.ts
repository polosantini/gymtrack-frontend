import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Sin API Gateway: el proxy de Vite manda cada ruta a su microservicio.
const MIEMBROS = 'http://localhost:8081'
const CLASES = 'http://localhost:8082'
const PAGOS = 'http://localhost:8083'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/miembros': MIEMBROS,
      '/api/planes': MIEMBROS,
      '/api/membresias': MIEMBROS, // POST /api/membresias/procesar-vencimientos (#32)
      '/api/clases': CLASES,
      '/api/reservas': CLASES,
      '/api/pagos': PAGOS,
      '/api/notificaciones': PAGOS,
    },
  },
})
