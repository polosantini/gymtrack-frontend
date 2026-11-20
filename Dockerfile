# Imagen del frontend para la demo (issue #42).
# Dos etapas: Node compila la aplicación y nginx sirve el resultado.
# El contenedor final no lleva Node ni node_modules: solo los archivos de dist/.

# ---------- Etapa 1: compilación ----------
FROM node:22-alpine AS build

WORKDIR /app

# Se copian primero los manifiestos para aprovechar la caché de Docker:
# mientras no cambien, no se vuelven a instalar las dependencias.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite reemplaza las variables VITE_* al compilar, no al ejecutar el contenedor.
# Por eso la decisión de usar el backend real se toma aquí.
# Para una imagen con datos simulados: docker build --build-arg USAR_MOCK=true .
ARG USAR_MOCK=false
ENV VITE_USAR_MOCK=$USAR_MOCK

RUN npm run build

# ---------- Etapa 2: servidor ----------
FROM nginx:1.27-alpine

# La imagen oficial reemplaza las variables de entorno de los archivos de
# /etc/nginx/templates y deja el resultado en /etc/nginx/conf.d/default.conf.
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Direcciones de los microservicios. Se pueden cambiar en docker-compose.yml
# sin reconstruir la imagen (ver README).
ENV MIEMBROS_URL=http://miembros-service:8081 \
    CLASES_URL=http://clases-service:8082 \
    PAGOS_URL=http://pagos-service:8083

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
