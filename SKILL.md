---
name: salty-meeples-patterns
description: Coding patterns extracted from Salty Meeples board game tracker
version: 1.0.0
source: local-git-analysis
analyzed_commits: 50
---

# Salty Meeples Development Patterns

## Commit Conventions

This project uses **conventional commits**:
- `feat:` - New features (44% of commits)
- `fix:` - Bug fixes (40% of commits)
- `chore:` - Maintenance tasks (8% of commits)
- `docs:` - Documentation updates (2% of commits)
- Scoped commits: `feat(component):` for module-specific changes

Example:
```
feat: Add mobile bottom navigation
fix: Update game detail links to use /bg-tracker/ prefix
chore: Rebrand to Salty Meeples
```

## Code Architecture

```
src/
├── app/
│   ├── (apps)/                    # App route groups
│   │   └── bg-tracker/            # Main app routes
│   │       ├── dashboard/         # Dashboard page
│   │       ├── games/             # Games library
│   │       │   └── [id]/          # Game detail (dynamic)
│   │       ├── sessions/          # Session management
│   │       │   ├── new/           # New session form
│   │       │   └── [id]/          # Session detail (dynamic)
│   │       ├── players/           # Player management
│   │       ├── leaderboard/       # Rankings
│   │       ├── stats/             # Statistics
│   │       │   └── head-to-head/  # Player comparison
│   │       └── settings/          # User settings
│   ├── (auth)/                    # Auth route group
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   └── api/                       # API routes
│       └── bgg/                   # BoardGameGeek integration
│           ├── search/
│           ├── game/
│           ├── collection/
│           └── expansions/
├── components/
│   ├── ui/                        # Reusable UI (Button, Card, Input, Badge)
│   └── layout/                    # Layout (Sidebar, BottomNav, AppLayout)
├── hooks/                         # Custom React hooks (use*.ts)
├── lib/
│   ├── supabase/                  # Supabase client
│   ├── bgg/                       # BGG API utilities
│   └── utils/                     # Utility functions
└── types/                         # TypeScript type definitions
```

## Key Patterns

### Route Groups
- `(apps)` - Protected app routes requiring auth
- `(auth)` - Public auth-related routes
- All app routes prefixed with `/bg-tracker/`

### Component Conventions
- UI components: `src/components/ui/` - PascalCase (Button.tsx, Card.tsx)
- Layout components: `src/components/layout/` - lowercase (sidebar.tsx)
- Pages: `page.tsx` in route folders
- Use `'use client'` directive for client components

### Custom Hooks
Pattern: `use{Resource}.ts`
```typescript
// src/hooks/useGames.ts
export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  // ... fetch logic
  return { games, loading, refetch };
}
```

Existing hooks:
- `useCurrentUser` - Auth user + profile
- `useGames` - Games list
- `useSessions` - Sessions with badges
- `useSessionDetail` - Single session
- `useLeaderboard` - Aggregated stats
- `useGameDetail` - Game + related sessions
- `useExpansions` - Expansions for game
- `useGroupData` - Group + members

### Supabase Patterns
```typescript
const supabase = createClient();

// Fetch with relations
const { data, error } = await supabase
  .from('sessions')
  .select(`
    *,
    game:games (*),
    players:session_players (
      *,
      profile:profiles (*)
    )
  `)
  .order('played_at', { ascending: false });
```

### Tailwind Patterns
- Dark theme by default
- Glass morphism: `variant="glass"` on Card
- Responsive: Mobile-first with `md:`, `lg:` breakpoints
- Touch targets: Minimum 44px for mobile (`min-h-[48px]`)
- Responsive padding: `px-3 md:px-6`

### Mobile Responsiveness
```typescript
// Tables need overflow wrapper
<div className="overflow-x-auto">
  <table className="w-full min-w-[400px]">
    ...
  </table>
</div>

// Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

// Touch-friendly buttons
<button className="min-h-[48px] min-w-[44px] p-3">
```

## Workflows

### Adding a New Page
1. Create folder: `src/app/(apps)/bg-tracker/{page-name}/`
2. Add `page.tsx` with `'use client'` if needed
3. Wrap with `<AppLayout>` component
4. Add to sidebar navigation in `src/components/layout/sidebar.tsx`

### Adding API Route
1. Create folder: `src/app/api/{service}/{endpoint}/`
2. Add `route.ts` with HTTP handlers
3. Use `NextResponse.json()` for responses

### Database Changes
1. Create migration in `migrations/` folder
2. Run in Supabase SQL editor
3. Update types in `src/types/`

### Before Deploy
1. Run `npm run build` - verify no type errors
2. Test locally with `npm run dev`
3. Commit with conventional commit message
4. Push to trigger Vercel deploy

## Testing

```bash
npm run test       # Unit tests (watch mode)
npm run test:run   # Unit tests (once)
```

- Test files in `src/lib/utils/__tests__/`
- Framework: Vitest + Testing Library

## Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `BGG_API_TOKEN` (for BoardGameGeek API)

## Frequently Changed Files

High-change files (refactor carefully):
1. `src/components/layout/sidebar.tsx` - Navigation
2. `src/app/(apps)/bg-tracker/sessions/new/page.tsx` - Session form
3. `src/app/(apps)/bg-tracker/stats/page.tsx` - Statistics
4. `src/app/(apps)/bg-tracker/dashboard/page.tsx` - Dashboard
5. `CLAUDE.md` - Project documentation
