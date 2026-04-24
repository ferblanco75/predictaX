# CLAUDE.md — Contexto para Claude Code

> Este archivo contiene todo el contexto necesario para que Claude Code pueda trabajar productivamente en PredictaX desde el primer mensaje. Actualizar este archivo a medida que el proyecto evoluciona.

## Qué es PredictaX

Plataforma de mercados de predicción para América Latina (similar a Polymarket). Los usuarios predicen sobre economía, política, deportes, tecnología y criptomonedas. Integra IA para análisis automatizado de mercados.

**Estado:** MVP en desarrollo activo. Frontend + Backend + AI funcionando localmente. Falta deploy a producción.

## Equipo y Roles

- **1 desarrollador** — maneja frontend (Next.js) y backend (FastAPI), trabaja en paralelo en la misma branch
- **Usuario (infra-focused)** — Docker, CI/CD, monitoreo, seguridad, deploy. NO es desarrollador full-stack, por eso los cambios de código se explican simple
- **Ambos trabajan sobre `feature/dev-sprint-1`** actualmente

## Stack Técnico

### Frontend (`frontend/`)
- **Next.js 16.2.0** (App Router, Turbopack)
- **React 19.2.4** + TypeScript (strict mode)
- **Tailwind CSS 4** + shadcn/ui + Framer Motion
- **Zustand** (state management) + **TanStack React Query** (data fetching)
- **Recharts** (charts)
- **Sentry** (error tracking — ya instalado, falta DSN en producción)
- **Google Analytics** (ya instalado)
- **Vercel Analytics** (ya instalado)
- **Resend** (emails — ya instalado, falta API key)
- **axios** fijado a `1.13.6` (supply chain attack mitigation — NO actualizar hasta que se resuelva issue #56)

### Backend (`backend/`)
- **FastAPI** + **Python 3.11** + **Poetry**
- **PostgreSQL 15** con **SQLAlchemy 2.0** ORM
- **Alembic** para migraciones
- **Redis 7** para cache
- **JWT auth** con `python-jose` + `passlib[bcrypt]`
- **google-genai** para AI (Google Gemini Flash 2.5)
- **prometheus-fastapi-instrumentator** para métricas
- **pytest** + fixtures para tests

### Infraestructura
- **Docker Compose** con 10 servicios: frontend, backend, postgres, redis, prometheus, grafana, alertmanager, node-exporter, postgres-exporter, redis-exporter
- **Todos los puertos configurables** via `.env` (para evitar conflictos con otros servicios locales)
- **Plan de deploy**: Vercel (frontend, free) + Render (backend, free tier). Confirmado por el developer.
- **Base de datos en producción**: Pendiente de decisión (Neon o Supabase, ambos free)

## Estructura del Repo

```
predictaX/
├── frontend/               # Next.js app
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   │   ├── admin/     # Admin panel (protected)
│   │   │   ├── (auth)/    # Auth routes
│   │   │   ├── markets/   # Markets pages
│   │   │   └── ...
│   │   ├── components/    # React components
│   │   ├── lib/
│   │   │   ├── api/       # API clients (markets, admin)
│   │   │   ├── stores/    # Zustand stores
│   │   │   └── ...
│   ├── Dockerfile         # Multi-stage (dev + prod)
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── routers/       # auth, markets, predictions, users, admin
│   │   ├── services/      # auth, market, prediction, ai_service
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── core/          # database, security, tracking
│   │   └── main.py
│   ├── alembic/           # DB migrations
│   ├── tests/             # pytest tests (50+ tests)
│   ├── scripts/
│   │   └── seed_data.py   # Seed 28 markets + 4 users
│   ├── Dockerfile
│   └── pyproject.toml
├── infra/                 # Observability stack configs
│   ├── prometheus/
│   ├── grafana/
│   └── alertmanager/
├── docs/                  # Docs (infra research, API endpoints)
├── .github/workflows/
│   └── ci.yml             # GitHub Actions CI
├── docker-compose.yml     # All services
├── CLAUDE.md              # Este archivo
└── README.md
```

## Workflow de Git (IMPORTANTE)

**Reglas estrictas del usuario:**
1. **NUNCA merge directo a master.** Siempre crear PR primero.
2. **Nombres de branch con issue ID:** `feature/<issue-id>-<descripcion>` (ej: `feature/17-docker-compose`)
3. **El usuario y el developer trabajan en paralelo** en la misma branch. Hacer `git pull --no-rebase` antes de cada push.
4. **Pushear frecuentemente** para sincronizar con el developer
5. **Commit messages en inglés**, prefijos convencionales: `feat:`, `fix:`, `docs:`, `chore:`
6. **Co-Authored-By al final del commit:** `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>`
7. **`.env` nunca se commitea** (tiene secrets como GEMINI_API_KEY)

**Branch actual de trabajo:** `feature/dev-sprint-1` (branch de sprint genérica, se van sumando cambios)

## Desarrollo Local

### Levantar todo
```bash
docker compose up -d
```

### Puertos por defecto (todos configurables en `.env`)
| Servicio | Puerto local | Interno |
|----------|-------------|---------|
| Frontend | **3001** | 3000 |
| Backend | **8001** | 8000 |
| PostgreSQL | **5433** | 5432 |
| Redis | **6380** | 6379 |
| Prometheus | 9090 | 9090 |
| Grafana | **3005** | 3000 |
| Alertmanager | 9093 | 9093 |
| Node Exporter | 9100 | 9100 |
| Postgres Exporter | 9187 | 9187 |
| Redis Exporter | 9121 | 9121 |

> **IMPORTANTE:** Los puertos 3000, 3002, 3003 ya están ocupados por otros servicios locales del usuario. NO tocar ni intentar usarlos. Si Grafana u otro servicio colisiona, cambiar a otro puerto en `.env`.

### Variables de entorno locales
El usuario tiene un `.env` en la raíz del proyecto con los overrides de puertos:
```env
FRONTEND_PORT=3001
BACKEND_PORT=8001
POSTGRES_PORT=5433
REDIS_PORT=6380
GRAFANA_PORT=3005
# etc.
```

### Credenciales del seed
```
admin@predictax.com / admin1234   (role: admin)
demo@predictax.com  / demo1234    (role: user)
alice@predictax.com / alice1234   (role: user)
bob@predictax.com   / bob1234     (role: user)
```

### Seed inicial de datos
```bash
docker compose exec backend python scripts/seed_data.py
```
Crea: 4 users, 28 markets, 8 predictions, 182 market snapshots.

### URLs locales
- Frontend: http://localhost:3001
- Backend API docs: http://localhost:8001/api/docs
- Backend metrics: http://localhost:8001/api/metrics
- Grafana: http://localhost:3005 (admin/admin)
- Prometheus: http://localhost:9090

## Volúmenes Docker (IMPORTANTE)

El `docker-compose.yml` monta estos volúmenes del backend:
```yaml
- ./backend/app:/app/app
- ./backend/tests:/app/tests
- ./backend/alembic:/app/alembic
- ./backend/scripts:/app/scripts
- ./backend/.env:/app/.env
```

**Por qué importa:** Cualquier cambio en esos directorios se refleja inmediatamente en el container sin rebuild. Si tenés que tocar algo fuera de esas rutas (ej: `pyproject.toml`), **necesitás `docker compose up --build backend`**.

## Tests

### Backend (50+ tests, corriendo en 15s)
```bash
# Crear DB de test (primera vez)
docker compose exec postgres psql -U predictax -c "CREATE DATABASE predictax_test;"

# Instalar pytest en container (primera vez)
docker compose exec backend pip install pytest pytest-cov httpx

# Correr todos los tests
docker compose exec -e TEST_DATABASE_URL="postgresql://predictax:predictax_dev@postgres:5432/predictax_test" backend python -m pytest tests/ -v

# Tests específicos
docker compose exec -e TEST_DATABASE_URL="postgresql://predictax:predictax_dev@postgres:5432/predictax_test" backend python -m pytest tests/test_admin.py -v
```

### Frontend
**Sin tests aún.** Issue #23 abierto para setup de Vitest + React Testing Library.

### CI (GitHub Actions)
`.github/workflows/ci.yml` corre en cada PR a master/develop:
- `backend-test`: pytest + PostgreSQL service container + coverage
- `backend-lint`: ruff check
- `frontend-build`: npm ci + lint + build
- `docker-build`: verify Dockerfiles compile

## AI Integration (Gemini Flash 2.5)

### Cómo funciona
- Backend tiene `ai_service.py` con integración a Google Gemini
- Cache en Redis (6h TTL) para ahorrar requests del free tier (250 RPD)
- Tracking en `ai_usage_log` (tokens, latencia, cache hits)
- Endpoint: `POST /api/markets/{id}/ai-analysis` → devuelve probability, confidence, reasoning, key_factors, risks en JSON estructurado
- Fallback strategy recomendada (documentada en `docs/infra-backend-research.md`): Groq → Gemini → Mistral → OpenRouter (todos gratis)

### API Key
Está en `backend/.env` como `GEMINI_API_KEY` — **NO commitear el .env**. Para obtener una nueva, https://aistudio.google.com/apikey.

### Quota monitoring
Admin panel muestra quota usada/restante en tiempo real. Los cache hits NO cuentan contra la quota.

## Admin Panel

Solo accesible por usuarios con `role='admin'`. Protegido por:
1. **Backend**: dependency `get_current_admin()` verifica JWT + rol
2. **Frontend**: layout en `/admin` redirige si `user.role !== 'admin'`

### Secciones (6 páginas)
- `/admin` — Overview con KPIs, top users, activity feed, category breakdown
- `/admin/users` — Tabla con 4 tabs (todos, top activos, inactivos, engagement)
- `/admin/markets` — Ranking por actividad/volumen/participantes
- `/admin/predictions` — Gráfico de predicciones diarias
- `/admin/ai` — Quota, historial de uso, top markets analizados
- `/admin/performance` — Latencia (p50/p95/p99), error rate, endpoints

### Tracking automático
Middleware en `main.py` logea cada API request en `activity_log` (endpoint, latencia, status code, IP). El admin panel usa estos datos para las métricas de performance.

## Convenciones de Issues

### Labels
- `priority-critical`, `priority-high` — Prioridad
- `fase-1`, `fase-2`, `fase-3` — Fase del proyecto
- `frontend`, `backend`, `setup` — Área
- `security-finding` — Hallazgo de security scan (automático)

### Formato de issue
Todos los issues siguen este formato (copiar de issues existentes):
```markdown
## 🎯 Objetivo
## 👤 Responsable
## 📋 Tareas
## ⏱️ Estimación
## 🏷️ Labels
```

### Dependencias
Issues se referencian con `#XX`. Cuando un issue depende de otro, se menciona en "Dependencias".

## Decisiones Importantes (histórico)

1. **Free tier stack** — Vercel (frontend) + Render (backend) + Neon/Supabase (DB TBD). Todo a $0/mes para MVP.
2. **AI**: Gemini Flash 2.5 como primer proveedor. Fallback chain: Groq → Gemini → Mistral → OpenRouter.
3. **Tests son prioridad crítica** — cada feature nueva debe tener tests. No mergear sin tests.
4. **Admin panel es crítico** — 2FA con Google Authenticator en roadmap (#58).
5. **Dominio**: Recomendado `predictax.com` o `predictax.lat`. Pendiente de compra (#65).
6. **DB en producción**: Render PostgreSQL expira a los 30 días (free tier), NO usar. Usar Neon (permanente) o Supabase (pausa a los 7 días).

## Issues Críticos Abiertos (a tener en cuenta)

| # | Título | Bloquea |
|---|--------|---------|
| #56 | Axios Supply Chain Attack — NO hacer npm install | Cualquier npm install |
| #65 | Adquisición de dominio | Cloudflare, Search Console, Resend, OAuth |
| #72 | GDPR Compliance | Launch |
| #50 | OWASP Top 10 protection | Launch |
| #68 | Automated OWASP scanning | Security baseline |
| #58 | 2FA para admin | Security admin |
| #64 | Tests backend (parcialmente hecho) | CI confianza |
| #23 | Tests frontend | CI confianza |

## Gotchas / Cosas que Aprendimos

1. **CORS**: Backend corre en puerto 8000 internamente pero el browser lo ve en 8001. CORS debe permitir `http://localhost:3001` (frontend local). Config en `docker-compose.yml` (`CORS_ORIGINS`).

2. **UUIDs en schemas**: El schema `UserResponse` originalmente tenía `id: int` pero los modelos usan UUID. Esto generaba 500s en `/api/auth/me`. Siempre usar `id: UUID` en schemas cuando el modelo usa UUID.

3. **Alembic migrations**: Se generan dentro del container (`/app/alembic/versions/`) pero el volume del host solo montaba `app/`. Ahora también se montan `alembic/`, `scripts/`, `tests/` y `.env`.

4. **Grafana datasource UID**: Al provisionar Grafana con datasource Prometheus, hay que setear un `uid: prometheus` explícito en el YAML, si no los dashboards no pueden referenciarlo. Si se cambia después de la primera inicialización, hay que borrar el volume `predictax_grafana_data` para evitar conflictos.

5. **Prometheus metrics labels**: El instrumentator de FastAPI usa labels como `status="2xx"` (no `status="500"`). Las queries PromQL deben usar `status=~"2xx"` o `status="5xx"`, no regex numéricos.

6. **Tests**: `conftest.py` usa `os.environ.get("TEST_DATABASE_URL", default)`. La DB de test se crea con `CREATE DATABASE predictax_test;` una sola vez. Los tests usan transacciones con rollback, así que no ensucian la DB entre tests.

7. **Docker port conflicts**: El usuario tiene varios servicios locales corriendo. Puertos 3000, 3002, 3003 están ocupados. Siempre preguntar antes de asumir puertos libres o usar env vars para hacer configurable todo.

8. **Vercel Analytics meta tags**: Los `twitter:card`, `twitter:title` etc. en Open Graph son estándar y NO deben cambiarse a "X", aunque Twitter ahora se llame X. Solo cambiar referencias visibles al usuario.

## Memory System (`.claude/projects/.../memory/`)

Claude mantiene memoria persistente entre sesiones:
- `user_role.md` — usuario es infra-focused, 1 developer en el equipo
- `feedback_testing.md` — testing es prioridad crítica
- `feedback_git_workflow.md` — nunca merge a master, siempre PR
- `project_infra_decision.md` — Vercel + Render confirmado
- `project_status.md` — estado actual del proyecto

**Leer esta memoria al inicio de cada sesión** para tener el contexto completo.

## Próximos Pasos Típicos

Si arrancás una sesión nueva, estas son las cosas más probables que el usuario va a querer:
1. **Avanzar con infra** — más observabilidad, backups, CI/CD
2. **Más issues** — el usuario planifica mucho via issues de GitHub
3. **Tests** — siempre hay más tests por escribir
4. **Admin panel mejoras** — es su herramienta principal
5. **Seguridad** — hardening, scans, compliance

Si el usuario dice "continúa" o "seguimos", generalmente se refiere a lo último que estaban trabajando. Revisar el último commit en `feature/dev-sprint-1` para contexto.
