# CalorCheck — Controle de Calorias

A Portuguese-language daily calorie tracker webapp designed for mobile use (max-width 448px), with plans for future Android/iOS migration.

## Architecture

**Monorepo** managed by pnpm workspaces.

- `artifacts/calorie-tracker` — React + Vite frontend (Tailwind CSS, shadcn/ui, wouter routing)
- `artifacts/api-server` — Express REST API (Fastify-like structure, TypeScript)
- `lib/db` — Drizzle ORM schema + migrations (PostgreSQL)
- `lib/api-spec` — OpenAPI 3.0 spec (`openapi.yaml`)
- `lib/api-client-react` — Auto-generated React Query hooks from API spec
- `lib/object-storage-web` — Uppy-based file upload component (recipe photos)

## Features

### Dashboard (`/`)
- Calorie ring (progress circle) with daily goal
- Meal breakdown cards: Café, Almoço, Jantar, Lanche
- Date navigation (prev/next day)
- Food entry list with edit/delete
- Alert banners: on_track / warning / over_goal

### Histórico (`/history`)
- Weekly bar chart using Recharts
- 7-day calorie history

### Receitas (`/recipes`)
- Recipe list with photo, title, description, ingredients, instructions, calories/serving
- Favorites toggle (heart icon)
- Photo upload via object storage (GCS bucket)
- Expandable card view for full recipe details
- Tabs: Todas / Favoritas

### Ajustes (`/settings`)
- Custom daily calorie goal input
- Goal presets by category:
  - Emagrecimento forte: 1200 kcal
  - Emagrecimento moderado: 1500 kcal
  - Emagrecimento leve: 1800 kcal
  - Manutenção do peso: 2000 kcal
  - Ganho de massa leve: 2300 kcal
  - Ganho de massa: 2700 kcal
- Ebook link: saudavelarteculinaria.com.br/codigo-doce-livre (senha: docesemculpa2026)

## Database Schema (PostgreSQL via Drizzle)

- `settings` — Single row: `dailyGoal` (default 2000 kcal)
- `food_entries` — `id, name, calories, quantity, meal, date, createdAt`
- `recipes` — `id, title, description, ingredients, instructions, calories, photoPath, isFavorite, createdAt`

## API Routes

- `GET/PATCH /api/settings`
- `GET/POST /api/food-entries`
- `GET /api/summary?date=YYYY-MM-DD`
- `GET /api/weekly-stats`
- `GET/POST /api/recipes`
- `GET/DELETE /api/recipes/:id`
- `PATCH /api/recipes/:id/favorite`
- `POST /api/storage/uploads/request-url`
- `GET /api/storage/objects/*`

## Design

- Color palette: coral/cream — primary: `hsl(15 86% 62%)`, bg: `hsl(40 33% 98%)`
- Font: Outfit (Google Fonts)
- Mobile-first (max-width 448px)
- Bottom nav bar: Hoje / Semana / Receitas / Ajustes

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID` — GCS bucket ID for recipe photos
- `PRIVATE_OBJECT_DIR` — Private object storage directory
- `SESSION_SECRET` — Session secret
