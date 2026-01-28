# Architecture Refactoring Plan: Route Groups Migration

## Overview
Refactor the current flat file structure into a scalable Monorepo-style architecture using Next.js Route Groups.

## Target Architecture

```
src/app/
├── (marketing)/           <-- Landing Page (New Welcome Hub)
│   └── page.tsx           <-- Create new landing page
├── (auth)/                <-- Shared Authentication
│   ├── login/
│   ├── register/
│   ├── join/
│   ├── onboard/
│   └── auth/*
├── (apps)/                <-- The Applications Container
│   ├── bg-tracker/        <-- General Board Game Tracker
│   │   ├── dashboard/
│   │   ├── games/
│   │   ├── sessions/
│   │   ├── players/
│   │   ├── stats/
│   │   ├── collection/
│   │   └── layout.tsx     <-- Sidebar layout for BG Tracker
│   ├── vtes-tracker/      <-- VTES Session & Deck Tracker
│   │   ├── sessions/
│   │   ├── decks/
│   │   ├── cards/
│   │   ├── players/
│   │   ├── stats/
│   │   ├── page.tsx       <-- Main VTES dashboard
│   │   └── layout.tsx     <-- Sidebar layout for VTES Tracker
│   └── vtes-guess/        <-- VTES Card Guessing Game
│       ├── guess-card/
│       ├── leaderboard/
│       │   ├── guess/
│       │   │   ├── page.tsx
│       │   │   └── debug/
│       │   │       └── page.tsx
│       ├── mask-debug/
│       ├── test-image/
│       └── layout.tsx     <-- Full-screen game layout
└── api/                   <-- Shared API (Leave as is for now)
```

## Current File Mapping

### 1. AUTH (Move to `(auth)`)
- [ ] `src/app/login/` → `(auth)/login/`
- [ ] `src/app/register/` → `(auth)/register/`
- [ ] `src/app/join/` → `(auth)/join/`
- [ ] `src/app/onboard/` → `(auth)/onboard/`
- [ ] `src/app/auth/` → `(auth)/auth/`

### 2. BOARD GAME TRACKER (Move to `(apps)/bg-tracker`)
- [ ] `src/app/dashboard/` → `(apps)/bg-tracker/dashboard/`
- [ ] `src/app/games/` → `(apps)/bg-tracker/games/`
- [ ] `src/app/sessions/` → `(apps)/bg-tracker/sessions/`
- [ ] `src/app/players/` → `(apps)/bg-tracker/players/`
- [ ] `src/app/stats/` → `(apps)/bg-tracker/stats/`
- [ ] `src/app/collection/` → `(apps)/bg-tracker/collection/`
- [ ] `src/app/leaderboard/` → `(apps)/bg-tracker/leaderboard/` (if generic)

### 3. VTES TRACKER (Move to `(apps)/vtes-tracker`)
- [ ] `src/app/vtes/page.tsx` → `(apps)/vtes-tracker/page.tsx`
- [ ] `src/app/vtes/sessions/` → `(apps)/vtes-tracker/sessions/`
- [ ] `src/app/vtes/decks/` → `(apps)/vtes-tracker/decks/`
- [ ] `src/app/vtes/cards/` → `(apps)/vtes-tracker/cards/`
- [ ] `src/app/vtes/players/` → `(apps)/vtes-tracker/players/`
- [ ] `src/app/vtes/stats/` → `(apps)/vtes-tracker/stats/` (if exists)

### 4. VTES GUESS GAME (Move to `(apps)/vtes-guess`)
- [ ] `src/app/vtes/guess-card/` → `(apps)/vtes-guess/guess-card/`
- [ ] `src/app/vtes/leaderboard/guess/` → `(apps)/vtes-guess/leaderboard/guess/`
- [ ] `src/app/vtes/mask-debug/` → `(apps)/vtes-guess/mask-debug/`
- [ ] `src/app/vtes/test-image/` → `(apps)/vtes-guess/test-image/`

### 5. MARKETING (Create in `(marketing)`)
- [ ] `(marketing)/page.tsx` → Create new landing page

## Shared Resources (Keep in place)

### Components
```
src/components/
├── ui/                    <-- Shared UI components (Button, Card, etc.)
├── layout/                <-- Shared layout components (Sidebar, etc.)
├── forms/                 <-- Shared form components
└── vtes/                  <-- VTES-specific components (move to vtes-tracker or vtes-guess)
```

### Hooks
```
src/hooks/
├── useCurrentUser.ts      <-- Shared (auth)
├── useExpansions.ts       <-- BG Tracker specific
├── useGameDetail.ts       <-- BG Tracker specific
├── useGames.ts            <-- BG Tracker specific
├── useGroupData.ts        <-- BG Tracker specific
├── useLeaderboard.ts      <-- Generic, may need duplication
├── useSessionDetail.ts    <-- BG Tracker specific
├── useSessions.ts         <-- BG Tracker specific
├── useVtesDeckStats.ts    <-- VTES Tracker specific
├── useVtesGuessLeaderboard.ts <-- VTES Guess specific
├── useVtesLeaderboard.ts  <-- VTES Tracker specific
├── useVtesPlayerStats.ts  <-- VTES Tracker specific
└── useVtesSessions.ts     <-- VTES Tracker specific
```

### Lib
```
src/lib/
├── bgg.ts                 <-- BG Tracker specific
├── krcg/                  <-- VTES specific (may need duplication)
├── supabase/              <-- Shared (auth)
├── utils/                 <-- Shared utilities
└── vtes/                  <-- VTES specific (may need duplication)
```

## Execution Order

### Phase 1: Create Folder Structure
1. Create `(marketing)/` folder
2. Create `(auth)/` folder
3. Create `(apps)/` folder
4. Create `(apps)/bg-tracker/` folder
5. Create `(apps)/vtes-tracker/` folder
6. Create `(apps)/vtes-guess/` folder

### Phase 2: Move Auth (Low Risk)
1. Move `login/` → `(auth)/login/`
2. Move `register/` → `(auth)/register/`
3. Move `join/` → `(auth)/join/`
4. Move `onboard/` → `(auth)/onboard/`
5. Move `auth/` → `(auth)/auth/`
6. Fix any broken imports

### Phase 3: Move BG Tracker (Medium Risk)
1. Move `dashboard/` → `(apps)/bg-tracker/dashboard/`
2. Move `games/` → `(apps)/bg-tracker/games/`
3. Move `sessions/` → `(apps)/bg-tracker/sessions/`
4. Move `players/` → `(apps)/bg-tracker/players/`
5. Move `stats/` → `(apps)/bg-tracker/stats/`
6. Move `collection/` → `(apps)/bg-tracker/collection/`
7. Move `leaderboard/` → `(apps)/bg-tracker/leaderboard/` (if generic)
8. Fix all broken imports

### Phase 4: Move VTES Tracker (Medium Risk)
1. Create `layout.tsx` in `(apps)/vtes-tracker/` with VTES sidebar
2. Move `vtes/page.tsx` → `(apps)/vtes-tracker/page.tsx`
3. Move `vtes/sessions/` → `(apps)/vtes-tracker/sessions/`
4. Move `vtes/decks/` → `(apps)/vtes-tracker/decks/`
5. Move `vtes/cards/` → `(apps)/vtes-tracker/cards/`
6. Move `vtes/players/` → `(apps)/vtes-tracker/players/`
7. Fix all broken imports

### Phase 5: Move VTES Guess (Medium Risk)
1. Create `layout.tsx` in `(apps)/vtes-guess/` with full-screen game layout
2. Move `vtes/guess-card/` → `(apps)/vtes-guess/guess-card/`
3. Move `vtes/leaderboard/guess/` → `(apps)/vtes-guess/leaderboard/guess/`
4. Move `vtes/mask-debug/` → `(apps)/vtes-guess/mask-debug/`
5. Move `vtes/test-image/` → `(apps)/vtes-guess/test-image/`
6. Fix all broken imports

### Phase 6: Create Marketing Page
1. Create `(marketing)/page.tsx` with new landing page content

### Phase 7: Cleanup Root
1. Update root `layout.tsx` to be minimal (html, body, providers only)
2. Delete old root page.tsx (replace with redirect to marketing or new page)

## Critical: Import Fixing Strategy

### Using @/ Alias
The project should already have `@/` configured to point to `src/`. Update imports from:
```typescript
// Before (relative)
import { Button } from '../../components/ui/button';

// After (absolute)
import { Button } from '@/components/ui/button';
```

### Component-Specific Imports
VTES components in vtes-guess:
```typescript
// Before
import { MaskedCard } from '@/components/vtes/MaskedCard';

// After (may need to move component or keep import)
import { MaskedCard } from '@/components/vtes/MaskedCard'; // Keep if shared
// OR
import { MaskedCard } from '../components/vtes/MaskedCard'; // If moved to vtes-guess
```

### Hook-Specific Imports
```typescript
// Before (in VTES Guess)
import { useVtesGuessLeaderboard } from '@/hooks/useVtesGuessLeaderboard';

// After (should still work if hook stays in src/hooks/)
import { useVtesGuessLeaderboard } from '@/hooks/useVtesGuessLeaderboard';
```

## Layout Considerations

### Root Layout (`src/app/layout.tsx`)
Keep minimal - only providers, html, body tags:
```tsx
import './globals.css';
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### BG Tracker Layout (`(apps)/bg-tracker/layout.tsx`)
Add sidebar for BG Tracker:
```tsx
import { AppLayout } from '@/components/layout/app-layout';

export default function BGLayout({ children }) {
  return <AppLayout>{children}</AppLayout>;
}
```

### VTES Tracker Layout (`(apps)/vtes-tracker/layout.tsx`)
Add VTES-specific sidebar:
```tsx
import { AppLayout } from '@/components/layout/app-layout';
import { VTESNav } from '@/components/vtes/VTESNav';

export default function VTESLayout({ children }) {
  return (
    <AppLayout>
      <VTESNav />
      {children}
    </AppLayout>
  );
}
```

### VTES Guess Layout (`(apps)/vtes-guess/layout.tsx`)
Full-screen game layout (no sidebar):
```tsx
export default function GuessGameLayout({ children }) {
  return <>{children}</>;
}
```

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Broken imports | Test each route after moving |
| Lost components | Backup before moving |
| Runtime errors | Run tests after each phase |
| Navigation issues | Update all Links and router.push calls |

## Testing Checklist
- [ ] Auth routes work (login, register, join, onboard)
- [ ] BG Tracker routes work (dashboard, games, sessions, players, stats)
- [ ] VTES Tracker routes work (main page, sessions, decks, cards, players)
- [ ] VTES Guess routes work (game, leaderboard)
- [ ] API routes still work
- [ ] Sidebar navigation works in each app
- [ ] No console errors

## Rollback Plan
If something breaks:
1. Keep backup of original `src/app` folder
2. Use `git stash` before each phase
3. Can restore with `git stash pop`
