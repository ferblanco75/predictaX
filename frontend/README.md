# NeuroPredict - Frontend

Plataforma de predicción de mercados financieros con modelos de ML (demo frontend).

## Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript (strict mode)
- **Estilos**: Tailwind CSS
- **Componentes UI**: shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **HTTP Client**: Axios
- **Gráficos**: Recharts
- **Animaciones**: Framer Motion
- **Iconos**: Lucide React
- **Utilidades**: date-fns

## Estructura del Proyecto

```
src/
├── app/
│   ├── (auth)/          # Rutas de autenticación
│   ├── markets/         # Rutas de mercados
│   └── layout.tsx       # Layout principal
├── components/
│   ├── ui/              # Componentes shadcn/ui
│   ├── markets/         # Componentes custom de mercados
│   └── layout/          # Componentes de layout
├── lib/
│   ├── data/            # Mock data
│   ├── stores/          # Zustand stores
│   ├── types/           # TypeScript types
│   └── utils/           # Utilidades
└── styles/              # Estilos globales
```

## Getting Started

Instalar dependencias:

```bash
npm install
```

Ejecutar servidor de desarrollo:

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter
- `npm run lint:fix` - Ejecuta el linter y corrige errores automáticamente

## Configuración

- **TypeScript**: Modo strict habilitado
- **ESLint**: Configurado con reglas de Next.js y Prettier
- **Prettier**: Configurado para formateo consistente

## Deploy

El proyecto está configurado para desplegarse en [Vercel](https://vercel.com).
