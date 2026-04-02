# PredictaX

Plataforma de predicción de mercados financieros con modelos de Machine Learning.

## Estructura del Proyecto

- **`frontend/`**: Aplicación Next.js 14 con TypeScript, Tailwind CSS y shadcn/ui
- **Scripts**: Herramientas y utilidades del proyecto

## Frontend

El frontend está construido con Next.js 14 y utiliza:
- TypeScript (strict mode)
- Tailwind CSS
- shadcn/ui para componentes
- TanStack React Query para data fetching
- Zustand para state management
- Recharts para gráficos

Ver [frontend/README.md](./frontend/README.md) para más detalles.

## Requisitos

### Opción 1: Local
- Node.js >= 20.9.0
- npm >= 10.0.0

### Opción 2: Docker
- Docker >= 20.10
- Docker Compose >= 2.0

## Getting Started

### Con Docker Compose (recomendado)

```bash
# Desarrollo (con hot reload)
docker compose up

# Producción
docker compose -f docker-compose.prod.yml up --build
```

### Local (sin Docker)

```bash
cd frontend
npm install
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

## Docker Compose - Guía completa

### Levantar la app (desarrollo)

```bash
docker compose up
```

Esto construye la imagen y levanta el contenedor `predictax-frontend` en http://localhost:3000 con hot reload habilitado. Los cambios en `src/` y `public/` se reflejan automáticamente.

### Levantar la app (producción)

```bash
docker compose -f docker-compose.prod.yml up --build
```

Construye una imagen optimizada con el output standalone de Next.js.

### Comandos útiles

```bash
# Levantar en segundo plano
docker compose up -d

# Ver logs
docker compose logs -f frontend

# Detener los contenedores
docker compose down

# Reconstruir la imagen (después de cambios en package.json)
docker compose up --build

# Eliminar contenedores, volúmenes e imágenes
docker compose down --rmi all --volumes
```

### Notas

- Los contenedores usan el prefijo `predictax-` (ej: `predictax-frontend`)
- `WATCHPACK_POLLING=true` está habilitado para compatibilidad con Windows/WSL
- En desarrollo, `src/` y `public/` se montan como volúmenes para hot reload
- Para producción, `next.config.ts` usa `output: "standalone"` para generar una imagen optimizada

## Deployment

### Deployment en Vercel (Recomendado)

Para hacer deploy de PredictaX en producción con Vercel, consulta nuestra [guía completa de deployment](./DEPLOYMENT.md).

#### Quick Start

1. **Conecta el repositorio a Vercel**
   - Ve a [vercel.com/new](https://vercel.com/new)
   - Selecciona este repositorio
   - Root directory: `./frontend`

2. **Configura variables de entorno**
   - Copia las variables de `frontend/.env.example`
   - Agrégalas en Vercel Dashboard → Settings → Environment Variables
   - Variables críticas: `NEXT_PUBLIC_BASE_URL`, `RESEND_API_KEY`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`

3. **Configura el dominio custom**
   - En Vercel Dashboard → Settings → Domains
   - Agrega `neuropredict.app`
   - Configura DNS records (A y CNAME)

4. **Deploy**
   - Push a `main` branch
   - Vercel deploya automáticamente
   - Monitor: [vercel.com/dashboard](https://vercel.com/dashboard)

#### Recursos

- 📖 [Guía completa de deployment](./DEPLOYMENT.md)
- ✅ [Checklist de deployment](./DEPLOYMENT_CHECKLIST.md)
- 🔧 [Troubleshooting](./DEPLOYMENT.md#troubleshooting)

### Deployment Alternativo (VPS con Docker)

Si prefieres hacer deploy en tu propio servidor VPS:

```bash
# 1. Clonar repositorio en VPS
git clone https://github.com/tu-usuario/predictaX.git
cd predictaX

# 2. Configurar variables de entorno
cd frontend
cp .env.example .env
nano .env  # Edita con valores de producción

# 3. Build y deploy con Docker Compose
cd ..
docker compose -f docker-compose.prod.yml up -d --build

# 4. Configurar Nginx y SSL (ver DEPLOYMENT.md)
```

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para instrucciones completas de deployment con VPS.

## Environment Variables

El proyecto requiere las siguientes variables de entorno:

```bash
# App Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_ORG=your-org
SENTRY_PROJECT=predictax-frontend
SENTRY_AUTH_TOKEN=your-auth-token

# Waitlist Email (Resend)
RESEND_API_KEY=re_xxxxx
WAITLIST_EMAIL_TO=admin@predictax.com
```

Ver `frontend/.env.example` para la lista completa con descripciones.

## Licencia

Proyecto privado.
