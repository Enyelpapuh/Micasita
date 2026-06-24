# AGENTS — AI assistant workspace instructions

Quick links: [README.md](README.md) | [backend/HELP.md](backend/HELP.md)

## Commands

### Backend (Java 21, Spring Boot 3.2.6, Maven)
```
./mvnw clean package           # build JAR
./mvnw spring-boot:run         # dev server (DevTools hot reload)
./mvnw test                    # only BackendApplicationTests.java exists
```
Entrypoint: `com.micasita.backend.BackendApplication`
API base path: `/api` (`spring.mvc.servlet.path`)
Env loaded from `backend/.env` or root `.env` (both optional via `spring.config.import`)

### Frontend (React 19, Vite 8, TypeScript 5.9, Tailwind CSS 4)
```
npm install
npm run dev       # http://localhost:5173
npm run build     # typecheck (tsc -b) + bundle (vite build)
npm run lint      # eslint .
```
`@/` maps to `src/` (vite alias). No frontend tests.

### Mail-service (Node.js, Express, Nodemailer/Gmail OAuth2)
```
npm install
npm run dev       # node src/server.js on port 4000
```
Env: `mail-service/.env` — requires `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_FROM_ADDRESS`, `CONTACT_INBOX_TO`.

## Architecture

| Directory | Tech | Notes |
|---|---|---|
| `backend/` | Spring Boot monolith | Domain sub-packages under `entities/`, `repositories/`, `service/`: academico, admision, core, finanzas, talleres |
| `frontend/` | Vite + React SPA | `src/features/` per domain (auth, dashboard, landing, talleres, equipo, admision) |
| `mail-service/` | Express | Gmail OAuth2. Fire-and-forget email sending. 5 endpoints |

Key structural notes:
- **`controller/` and `controllers/`** both exist (1 file in `controllers/admin/`). Most REST endpoints are in `controller/`.
- **No centralized API client** — each frontend module creates its own Axios instance using `VITE_API_URL` (default `http://localhost:8080/api`). Auth headers are passed manually in most modules (only `AuthContext` has a shared axios instance with interceptor).
- **No Vite proxy** — frontend calls backend and mail-service directly.
- **`VITE_CONTACT_API_URL`** defaults to `http://localhost:4000/api` (used by ContactForm).
- **Database: SQL Server** (not MySQL). Flyway scripts in `db/migration/` but **disabled by default** (`FLYWAY_ENABLED=false`). Enable via `.env` to run migrations.
- **JWT auth**: token in `localStorage` under key `micasita.auth`. Session validated every 15s via `GET /auth/me`. Route guard: `RequireAuth` component.
- **Dashboard**: 17 views, sidebar with role/permission-based visibility, view switching via `DashboardView` enum.
- **Upload dirs**: `uploads/talleres/`, `uploads/anuncios/`, `uploads/estudiantes/documentos/` (configurable via `.env`).
- **Lombok** on backend. Watch for generated getters/setters/builders.

## Gotchas

- **UTF-8 on Windows**: Use `-Encoding utf8` or the Write tool for TSX/JS.
- **`.env` files are gitignored**. Do not commit real credentials. Backend `.env` currently has placeholder JWT secret.
- **`auth.types.ts` and `auth.types.tsx`** are duplicated (identical content).
- **No CI/CD**: `.github/` is gitignored. The `backend/.github/` subtree is an upgrade-planning artifact, not workflows.
- **Tests are mostly absent**: backend has only `BackendApplicationTests.java` (smoke test). Remove it or extend before adding new tests.
