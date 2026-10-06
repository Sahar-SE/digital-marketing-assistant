# Story 0.1: Monorepo Scaffold & Development Environment

Status: done

## Story

As a developer,
I want a fully configured monorepo with apps/web, services/api, packages/shared-types, packages/feature-flags, infra/docker, and infra/migrations workspaces,
So that all future stories have a consistent, runnable foundation with no conflicting tooling.

## Acceptance Criteria

- [x] Given the repository is cloned and npm install is run
- [x] When a developer runs npm run dev from the root
- [x] Then both the Next.js 14 web app and Node.js/Express API server start without errors, and localhost:3000 returns a working response
- [x] And the shared-types package is importable in both apps/web and services/api without circular dependency errors
- [x] And all environment variables are loaded from .env.local (web) and .env (api); no secrets exist in source files; a .env.example documents every required variable
- [x] And infra/docker/docker-compose.yml starts PostgreSQL 16 and Redis 7 locally with a single command
- [x] And infra/migrations contains an initial migration that creates the schema_migrations tracking table and runs successfully via the migration CLI

## Tasks / Subtasks

- [x] Create Monorepo Root structure & workspaces configuration (AC: #1)
- [x] Initialize `infra/docker` database configuration (AC: #6)
- [x] Create `packages/shared-types` workspace (AC: #4)
- [x] Create `packages/feature-flags` workspace (AC: #4)
- [x] Create `services/api` Node.js/Express app (AC: #3)
- [x] Create `apps/web` Next.js 14 app (AC: #3)
- [x] Configure `infra/migrations` workspace (AC: #7)
- [x] Implement Root Scripts (AC: #2)

## Dev Notes

- Handled via npm workspaces.
- Fonts integrated: Inter & Bricolage Grotesque.

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (Medium)

### File List

- [package.json](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/package.json)
- [apps/web/package.json](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/apps/web/package.json)
- [apps/web/tsconfig.json](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/apps/web/tsconfig.json)
- [apps/web/next.config.mjs](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/apps/web/next.config.mjs)
- [apps/web/src/app/layout.tsx](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/apps/web/src/app/layout.tsx)
- [apps/web/src/app/page.tsx](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/apps/web/src/app/page.tsx)
- [apps/web/src/app/globals.css](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/apps/web/src/app/globals.css)
- [apps/web/.env.local](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/apps/web/.env.local)
- [apps/web/.env.example](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/apps/web/.env.example)
- [services/api/package.json](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/services/api/package.json)
- [services/api/tsconfig.json](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/services/api/tsconfig.json)
- [services/api/src/index.ts](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/services/api/src/index.ts)
- [services/api/.env](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/services/api/.env)
- [services/api/.env.example](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/services/api/.env.example)
- [packages/shared-types/package.json](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/packages/shared-types/package.json)
- [packages/shared-types/tsconfig.json](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/packages/shared-types/tsconfig.json)
- [packages/shared-types/src/index.ts](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/packages/shared-types/src/index.ts)
- [packages/feature-flags/package.json](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/packages/feature-flags/package.json)
- [packages/feature-flags/tsconfig.json](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/packages/feature-flags/tsconfig.json)
- [packages/feature-flags/src/index.ts](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/packages/feature-flags/src/index.ts)
- [infra/docker/docker-compose.yml](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/infra/docker/docker-compose.yml)
- [infra/migrations/package.json](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/infra/migrations/package.json)
- [infra/migrations/migrate.js](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/infra/migrations/migrate.js)
- [infra/migrations/sql/001_init.sql](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/infra/migrations/sql/001_init.sql)
