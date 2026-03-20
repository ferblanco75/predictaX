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

## Licencia

Proyecto privado.
