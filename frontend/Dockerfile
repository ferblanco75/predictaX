# ---- Base ----
FROM node:20.18-alpine AS base
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- Development ----
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
ENV HOSTNAME=0.0.0.0
CMD ["npm", "run", "dev"]

# ---- Build ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Production ----
FROM base AS prod
ENV NODE_ENV=production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

USER appuser
EXPOSE 3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
