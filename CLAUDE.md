# Game Night Tracker - Contexto del Proyecto

## Descripción
App para loguear sesiones de juegos de mesa con amigos. Trackea partidas, estadísticas, y rankings del grupo.

## Stack
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend:** Supabase (auth + PostgreSQL)
- **APIs externas:** BoardGameGeek XML API2

## Estructura Principal
```
src/
├── app/
│   ├── api/bgg/collection/   # API route para fetch de BGG (server-side)
│   ├── dashboard/            # Dashboard principal
│   ├── games/                # Biblioteca de juegos
│   ├── sessions/             # Historial de sesiones
│   ├── players/              # Gestión de grupo
│   ├── stats/                # Estadísticas
│   └── settings/             # Config + importar colección BGG
├── components/ui/            # Componentes reutilizables
├── hooks/                    # Custom React hooks
│   ├── useCurrentUser.ts     # Auth user + profile
│   ├── useGames.ts           # Games list (non-expansions)
│   ├── useSessions.ts        # Sessions with badges
│   ├── useSessionDetail.ts   # Single session + "New to Me"
│   ├── useLeaderboard.ts     # Aggregated player stats
│   ├── useGameDetail.ts      # Game + related sessions
│   ├── useExpansions.ts      # Expansions for game
│   └── useGroupData.ts       # Group + members
├── lib/
│   ├── supabase/             # Cliente Supabase
│   ├── bgg/                  # Funciones para BGG API
│   └── utils/                # Utility functions (with tests)
└── types/                    # TypeScript types
```

## Estado Actual (Enero 2026)

### Completado
- Autenticación (email + Google OAuth)
- Landing page
- UI components (Button, Card, Input, Badge, etc.)
- Sidebar y navegación
- Schema de base de datos en Supabase
- API route `/api/bgg/collection` para importar colección de BGG

### Pendiente - BGG API Token
BGG cambió su API en 2025 y ahora requiere tokens de autorización.

**Estado:** Esperando aprobación de registro en https://boardgamegeek.com/applications

**Cuando llegue el token:**
1. Agregarlo a `.env.local`:
   ```
   BGG_API_TOKEN=el_token_aqui
   ```
2. Probar importar colección en Settings con usuario `patochaos`
3. Actualizar las otras funciones de BGG (`searchGames`, `getGameDetails`, `getHotGames`) para usar el token también

### Próximas Funcionalidades (por implementar)
- [ ] Crear API routes para search y details de BGG (con token)
- [ ] CRUD de sesiones de juego
- [ ] Formulario para registrar partidas
- [ ] Sistema de estadísticas (win rates, H-index)
- [ ] Tabla de líderes del grupo
- [ ] Gestión de jugadores/grupo

## Usuario BGG del Owner
- Username: `patochaos`

## Comandos Útiles
```bash
npm run dev      # Iniciar servidor de desarrollo
npm run build    # Build de producción
npm run lint     # Linter
npm run test     # Run unit tests (watch mode)
npm run test:run # Run unit tests once
npx playwright test  # Run E2E tests
```

## Variables de Entorno Requeridas
Ver `.env.local.example`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `BGG_API_TOKEN` (pendiente de aprobación)
 
## Changelog

### 2026-01-17
- **Type Safety:** Fixed 13 `any` type instances across the codebase with proper interfaces
- **Unit Tests:** Added vitest + testing-library with 32 tests for utility functions
- **Guest Players:** Added `guest_players` table for tracking non-registered players in sessions
  - Migration: `migrations/03_guest_players.sql` (needs to be run on Supabase)
  - Sessions now display guest players with "GUEST" badge
- **Custom Hooks:** Created 8 reusable hooks in `src/hooks/` for data fetching:
  - `useCurrentUser`, `useGames`, `useSessions`, `useSessionDetail`
  - `useLeaderboard`, `useGameDetail`, `useExpansions`, `useGroupData`

### 2026-01-16
- Initial git commit and push to GitHub (Deployment initialization)
- Deployed to Vercel: https://board-game-tracker-78pn.vercel.app/
