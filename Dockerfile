FROM node:20 AS builder
WORKDIR /app

ARG GIT_SHA
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=2048

# Quebra cache a cada deploy
RUN echo "build=$GIT_SHA"

COPY package*.json ./

# Instala dependências + binários nativos Linux (lightningcss/oxide precisam da versão linux-x64)
RUN npm ci --include=dev --include=optional
RUN npm install --no-save \
    lightningcss-linux-x64-gnu \
    @tailwindcss/oxide-linux-x64-gnu \
    2>/dev/null || true

COPY . .
RUN npx prisma generate || true
RUN npm run build

FROM node:20 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["npm","run","start"]
