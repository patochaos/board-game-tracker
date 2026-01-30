# Salty Meeples - Contexto del Proyecto

## Descripción
App para loguear sesiones de juegos de mesa con amigos. Trackea partidas, estadísticas, y rankings del grupo. Crown the saltiest meeple in your group!

## Stack
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend:** Supabase (auth + PostgreSQL)
- **APIs externas:** BoardGameGeek XML API2

## Estructura Principal
```
src/
├── app/
│   ├── api/bgg/
│   │   ├── collection/       # Importar colección de usuario BGG
│   │   ├── search/           # Buscar juegos en BGG
│   │   ├── game/             # Agregar juego + detectar expansiones
│   │   └── expansions/       # Importar expansiones
│   ├── dashboard/            # Dashboard principal
│   ├── games/                # Biblioteca de juegos (con modal de expansiones)
│   ├── sessions/             # Historial de sesiones
│   ├── players/              # Gestión de grupo
│   ├── stats/                # Estadísticas
│   └── settings/             # Config usuario + BGG username
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
- **BGG Integration (completa):**
  - API route `/api/bgg/collection` - importar colección de BGG
  - API route `/api/bgg/search` - buscar juegos en BGG
  - API route `/api/bgg/game` - agregar juego individual + detectar expansiones
  - API route `/api/bgg/expansions` - importar expansiones con `base_game_id`
  - Token configurado en `.env.local` y Vercel
- **Sistema de Expansiones:**
  - Al agregar un juego, detecta expansiones disponibles en BGG
  - Modal para seleccionar e importar expansiones
  - Relación `base_game_id` en tabla games
  - Selector de expansiones en formulario de sesión
- CRUD de sesiones de juego (List, Create, Edit, Delete)
- Formulario para registrar partidas (con soporte de expansiones)
- Sistema de grupos e invitaciones
- **Sistema de Estadísticas (completo):**
  - H-index calculation
  - Win rates por jugador y por juego
  - Weekly activity chart
  - Achievements system
  - Nemesis tracking
  - Head-to-head comparison (`/stats/head-to-head`)
- **Leaderboard:**
  - Podio visual top 3
  - Tabla completa con filtro por mes
  - Win rate y total de plays
- **Export Data:**
  - Export sessions to CSV desde Settings

### Próximas Funcionalidades (por implementar)
- [ ] PWA support
- [ ] Share session results (shareable link/image)
- [ ] Light theme option
- [ ] Gestión avanzada de jugadores/grupo

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

## Workflow de Features (IMPORTANTE)
Antes de hacer deploy de cualquier feature nueva:
1. **Build check:** Ejecutar `npm run build` para verificar que no hay errores de tipos
2. **Local testing:** Lanzar `npm run dev` y probar la feature manualmente
3. **Pasar URL al usuario:** Compartir http://localhost:3000 para que el usuario pruebe
4. **Deploy solo después de aprobación del usuario**

## Variables de Entorno Requeridas
Ver `.env.local.example`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `BGG_API_TOKEN` (configurado y funcionando)
 
## Changelog

### 2026-01-29
- **Rebranding:** Renamed from "Board Game Tracker" to "Salty Meeples"
- **VTES code removed:** VTES module moved to separate INCONNU repository

### 2026-01-28
- **Expansion Support:**
  - Modified `/api/bgg/game` to detect and return available expansions from BGG
  - Created `/api/bgg/expansions` endpoint to import expansions with `base_game_id`
  - Added expansion selection modal in Games page after adding a game
  - Improved session form to find expansions by `base_game_id` (more accurate than name matching)
  - Added expansions display on game detail page (`/games/[id]`)
  - Migration: `migrations/17_base_game_id.sql`
- **Head-to-Head Comparison:**
  - Created `/stats/head-to-head` page for comparing two players
  - Shows total games played together, win/loss breakdown
  - Breakdown by game with visual bars
  - Recent matches list with links to sessions
- **Settings Simplification:**
  - Removed BGG API token field from Settings (app uses its own token)
  - Users only need to enter BGG username
  - Added quick action links to Settings page
- **Build Fixes:**
  - Fixed Suspense boundary issue in `/join`, `/login`, `/register` pages
  - Fixed TypeScript Set iteration compatibility
  - Fixed invalid status type in settings page
- **Export Data:**
  - Added Export Sessions to CSV in Settings page
  - Includes game names, players, winners, scores, dates, and notes
- **Documentation:**
  - Updated README.md with completed features
  - Updated CLAUDE.md with current state

**IMPORTANTE - Configurar en Vercel:**
Para que BGG funcione en producción, agregar en Vercel Dashboard → Settings → Environment Variables:
- `BGG_API_TOKEN` = `84116b89-3590-4e45-932f-75c6e62215d3`

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
