# AGENTS — AI assistant workspace instructions

Purpose: give short, actionable guidance for coding assistants to get productive quickly in this repository.

Quick links
- Project README: [README.md](README.md)
- Backend help: [backend/HELP.md](backend/HELP.md)

Quick start

- Backend (Java / Maven):
  - Build: `./mvnw clean package` (Unix) or `mvnw.cmd clean package` (Windows)
  - Run: `./mvnw spring-boot:run` or use the generated jar in `target/`
  - Tests: `./mvnw test`
- Frontend (Vite / npm):
  - Install: `npm install` (run in `/frontend`)
  - Dev server: `npm run dev` (serves at http://localhost:5173 by default)
  - Build: `npm run build`

Important files & directories
- Backend source: [backend/src/main/java](backend/src/main/java)
- Backend config & resources: [backend/src/main/resources](backend/src/main/resources)
  - DB migrations: [backend/src/main/resources/db/migration](backend/src/main/resources/db/migration)
  - SQL snapshots: [backend/sql](backend/sql)
- Frontend source: [frontend/src](frontend/src)
- Frontend package manifest: [frontend/package.json](frontend/package.json)

Conventions & notes for agents
- Prefer minimal, link-first guidance — link to existing docs instead of copying large sections.
- Use the backend `mvnw` wrapper where possible to ensure consistent Maven version.
- When editing frontend TSX/JS files on Windows, preserve UTF-8 encoding (PowerShell Set-Content needs `-Encoding utf8`).
- Database changes: prefer to add migration scripts into `backend/src/main/resources/db/migration` and reference `backend/sql` for snapshots.

What agents should not do automatically
- Run destructive database migrations on production or attempt to push commits without explicit user approval.

If you need more context
- Explore the codebase files mentioned above. If the task is scoped to `backend` or `frontend`, suggest creating a focused `.instructions.md` or skill for that area.

Created by: AI assistant (agent customization)
