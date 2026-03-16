FROM node:20 AS builder
WORKDIR /app

# Evita telemetria e desativa bindings nativos problemáticos
ENV NEXT_TELEMETRY_DISABLED=1
ENV TAILWIND_DISABLE_LIGHTNINGCSS=1
ENV LIGHTNINGCSS_FORCE_WASM=1
ENV TAILWIND_DISABLE_OXIDE=1

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala exatamente as versões do package-lock (evita Prisma/Next quebrando em updates)
RUN npm ci --include=dev --include=optional
RUN LC_VER=$(node -p "require('./package-lock.json').packages['node_modules/lightningcss'].version") && npm i --no-save "lightningcss-linux-x64-gnu@$LC_VER" && node -e "require('lightningcss'); console.log('lightningcss ok')"
RUN OXIDE_VER=$(node -p "require('./package-lock.json').packages['node_modules/@tailwindcss/oxide'].version") && npm i --no-save "@tailwindcss/oxide-linux-x64-gnu@$OXIDE_VER" && node -e "require('@tailwindcss/oxide'); console.log('tailwindcss oxide ok')"

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
ENV TAILWIND_DISABLE_OXIDE=1

# Copia artefatos de build e runtime
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["npm","run","start"]
