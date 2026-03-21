# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Docker Compose for cross-platform deployment (dev and prod) (#17)
- Docker documentation in README

### Changed
- `next.config.ts` with `output: "standalone"` for optimized production builds

## [0.1.0] - 2026-03-19

### Added
- Initial project setup with Next.js 16, React 19, TypeScript
- Base UI components with shadcn/ui (Button, Card, Badge, Input, Select, etc.)
- Layout: Navbar with search and categories, Footer
- Home page with hero, categories, and featured markets
- Markets listing page with filters (category, status) and pagination
- Market detail page with probability chart (Recharts)
- Prediction form with slider and potential gain calculation
- Authentication page (login/register) with validation
- Dark mode with next-themes
- Mock data: 28 markets across 5 categories (economy, politics, sports, technology, crypto)
- State management with Zustand (auth, filters, points)
- API abstraction layer ready for real backend
- SEO: dynamic metadata, JSON-LD structured data, Open Graph
- Skeleton loaders, error boundaries, empty states
- Responsive design (mobile, tablet, desktop)
