FROM node:20 AS builder
WORKDIR /app

# Evita telemetria e força não usar lightningcss nativo
ENV NEXT_TELEMETRY_DISABLED=1
ENV TAILWIND_DISABLE_LIGHTNINGCSS=1
ENV LIGHTNINGCSS_FORCE_WASM=1

# Instala usando package.json (não usa ci para permitir alias dinâmico)
COPY package*.json ./
RUN npm install && npm install -D lightningcss@npm:lightningcss-wasm@1

# Copia o código e gera Prisma + build
COPY . .
RUN npx prisma generate || true
RUN npm run build

FROM node:20 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TAILWIND_DISABLE_LIGHTNINGCSS=1
ENV LIGHTNINGCSS_FORCE_WASM=1

# Copia artefatos de build e runtime
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["npm","run","start"]
