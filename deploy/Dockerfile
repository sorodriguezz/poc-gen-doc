# Etapa 1: build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiamos solo lo necesario para instalación
COPY package*.json ./

RUN npm install

# Copiamos el resto del código (excluyendo archivos innecesarios)
COPY src ./src
COPY tsconfig*.json ./
COPY nest-cli.json ./ 
COPY eslint.config.mjs ./

# Compilamos Nest (TypeScript -> JS)
RUN npm run build

# Etapa 2: runtime
FROM node:20-alpine

WORKDIR /app

# Copiamos solo lo necesario para correr la app
COPY package*.json ./

RUN npm install --only=production

# Copiamos los JS ya compilados desde la etapa de build
COPY --from=builder /app/dist ./dist

# Variables por defecto (las puedes overridear en docker-compose)
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/main.js"]
