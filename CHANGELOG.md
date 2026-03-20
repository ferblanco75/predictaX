# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Unreleased]

### Added
- Docker Compose para despliegue multiplataforma (dev y prod) (#17)
- Documentación de Docker en README

### Changed
- `next.config.ts` con `output: "standalone"` para builds de producción optimizados

## [0.1.0] - 2026-03-19

### Added
- Setup inicial del proyecto con Next.js 16, React 19, TypeScript
- Componentes UI base con shadcn/ui (Button, Card, Badge, Input, Select, etc.)
- Layout: Navbar con búsqueda y categorías, Footer
- Página Home con hero, categorías y mercados destacados
- Página de listado de mercados con filtros (categoría, estado) y paginación
- Página de detalle de mercado con gráfico de probabilidad (Recharts)
- Formulario de predicciones con slider y cálculo de ganancia
- Página de autenticación (login/registro) con validación
- Dark mode con next-themes
- Mock data: 28 mercados en 5 categorías (economía, política, deportes, tecnología, crypto)
- State management con Zustand (auth, filtros, puntos)
- API abstraction layer preparada para backend real
- SEO: metadata dinámica, JSON-LD structured data, Open Graph
- Skeleton loaders, error boundaries, empty states
- Diseño responsive (mobile, tablet, desktop)
