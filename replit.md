# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Apps

### CalorCheck — Controle de Calorias (`artifacts/calorie-tracker`)

A daily calorie tracker webapp in Portuguese. Features:
- Dashboard with calorie ring showing consumed vs goal
- Meal breakdown by category (breakfast, lunch, dinner, snack)
- Date navigation to browse past days
- Add food entries with name, calories, quantity, and meal type
- Alert banners for warning (>80% goal) and over-goal states
- Weekly history with bar chart (Recharts)
- Settings page to configure daily calorie goal
- Mobile-first responsive design (max-width 448px)
- Warm coral/cream color palette with Outfit font

### API Server (`artifacts/api-server`)

REST API built with Express 5. Endpoints:
- `GET/PUT /api/settings` — daily goal configuration
- `GET /api/food-entries?date=YYYY-MM-DD` — list entries by date
- `POST /api/food-entries` — add food entry
- `DELETE /api/food-entries/:id` — remove food entry
- `GET /api/summary?date=YYYY-MM-DD` — daily summary with status
- `GET /api/weekly-stats` — last 7 days stats

### DB Schema (`lib/db/src/schema/`)
- `settings` — single row with `daily_goal` (default 2000 kcal)
- `food_entries` — food diary with name, calories, quantity, meal, date
