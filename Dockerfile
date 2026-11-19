# Etapa 1: Construcción de frontend y bundle de servidor
# Node 24+ es necesario por la base de datos integrada (node:sqlite).
FROM node:24-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Etapa 2: Imagen ligera de ejecución en producción
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# Base de datos, fotos y respaldos. Montar SIEMPRE como volumen: si no, un redespliegue borra los datos.
ENV ORBI_DATA_DIR=/data
VOLUME ["/data"]

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
# Administrar usuarios dentro del contenedor: docker exec -it <contenedor> npm run user:prod -- list

EXPOSE 3000
CMD ["npm", "start"]
