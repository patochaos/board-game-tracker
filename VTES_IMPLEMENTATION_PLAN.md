# VTES Module Implementation Plan

> Created: 2026-01-18
> Goal: Complete VTES deck management and session tracking with leaderboards and metrics

---

## Current State

| Feature | Status | Location |
|---------|--------|----------|
| Deck Import | ✅ Complete | `/vtes/decks/import` |
| Deck Browser | ✅ Complete | `/vtes/decks` |
| Deck Detail | ⚠️ UI Issues | `/vtes/decks/[id]` |
| Card Search | ✅ Complete | `/vtes/cards` |
| Session Form | ⚠️ Basic | `/vtes/sessions/new` |
| Session History | ⚠️ Basic | `/vtes/sessions` |
| Leaderboards | ❌ Missing | - |
| Player Stats | ❌ Missing | - |
| Deck Stats | ❌ Missing | - |

---

## Phase 0: UI Polish (Bug Fixes)

### Objective
Fix visual issues in deck detail view to match VDB quality standards.

**Reference:** [VDB Deck View](https://vdb.im/decks/88962830c) | [VDB GitHub](https://github.com/smeea/vdb)

### Issue 1: Discipline Icons Look Poor

**Current Problems:**
- `brightness-0 invert` filter makes icons pure white (too harsh)
- Size 'sm' = 20px is too small for readability
- No drop-shadow, icons lack depth
- Icons appear flat and low-contrast

**VDB Implementation:**
- Uses `dark:brightness-[0.8]` for subtle dark mode adjustment
- Icons are 25px (mobile) / 28px (desktop)
- Applies `drop-shadow-[1px_1px_1px_gray]` for depth
- Superior disciplines use different icon set (not just brightness)

**Fix for `src/components/vtes/VtesIcon.tsx`:**

```typescript
// Update size mapping
const sizeMap = {
  xs: { min: 16, max: 16 },
  sm: { min: 22, max: 22 },  // Was 20, increase to 22
  md: { min: 28, max: 28 },  // Was 28, keep
  lg: { min: 36, max: 36 },
};

// Update filter - remove harsh invert, use subtle adjustment
// OLD: const filterClass = (type === 'discipline' || type === 'clan') ? 'brightness-0 invert' : '';
// NEW:
const filterClass = (type === 'discipline' || type === 'clan')
  ? 'drop-shadow-[1px_1px_1px_rgba(0,0,0,0.5)] dark:brightness-90'
  : '';
```

**Alternative: Use colored icons from KRCG**
- KRCG provides colored SVGs that don't need filtering
- Remove filter entirely if icons are already styled

### Issue 2: Card Hover Preview Flickers

**Current Problems:**
- Image loads fresh on every hover (network request)
- State change (`setHoveredCardUrl`) causes re-render
- No preloading of card images
- Position recalculates on each hover

**VDB Implementation:**
- Uses tooltip library with built-in positioning
- Preloads card images when deck data loads
- Modal/tooltip component handles show/hide without full re-render
- Uses CSS transitions for smooth appearance

**Fix Strategy:**

#### Option A: Preload Images + CSS-Only Visibility

```typescript
// In deck detail page, preload all card images on mount
useEffect(() => {
  if (hydratedCards.size > 0) {
    hydratedCards.forEach(card => {
      const img = new Image();
      img.src = card.url;
    });
  }
}, [hydratedCards]);

// Change hover preview to use opacity transition instead of conditional render
// Keep image always mounted, toggle visibility with CSS
<div
  className={`fixed z-[9999] pointer-events-none transition-opacity duration-150 ${
    hoveredCardUrl ? 'opacity-100' : 'opacity-0'
  }`}
  style={{ ... }}
>
  {hoveredCardUrl && (
    <img src={hoveredCardUrl} ... />
  )}
</div>
```

#### Option B: Use React Tooltip Library (Recommended)

Install and use `@floating-ui/react` or `react-tooltip` for proper hover handling:

```bash
npm install @floating-ui/react
```

```typescript
// Create CardPreviewTooltip component
import { useFloating, offset, shift, autoPlacement } from '@floating-ui/react';

function CardPreviewTooltip({ children, imageUrl }: { children: React.ReactNode; imageUrl: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { refs, floatingStyles } = useFloating({
    placement: 'right',
    middleware: [offset(10), shift(), autoPlacement()],
  });

  return (
    <>
      <span
        ref={refs.setReference}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {children}
      </span>
      {isOpen && (
        <div ref={refs.setFloating} style={floatingStyles} className="z-[9999]">
          <img src={imageUrl} className="w-[300px] rounded-lg shadow-2xl" />
        </div>
      )}
    </>
  );
}
```

#### Option C: Pure CSS Hover (Simplest)

Use CSS `group-hover` with preloaded images:

```typescript
// Wrap card name in group container
<td className="relative group">
  <span className="text-blue-400 hover:text-blue-300 cursor-help">
    {item.card.name}
  </span>
  {/* Always render image, hide with CSS */}
  <div className="absolute left-full top-0 ml-4 opacity-0 group-hover:opacity-100
                  transition-opacity duration-150 pointer-events-none z-50">
    <img
      src={item.card.url}
      alt={item.card.name}
      className="w-[300px] rounded-lg shadow-2xl border-2 border-slate-700"
      loading="eager"
    />
  </div>
</td>
```

### Tasks

- [ ] **Fix VtesIcon component:**
  - [ ] Remove `brightness-0 invert` filter
  - [ ] Add `drop-shadow` for depth
  - [ ] Increase 'sm' size from 20px to 22-24px
  - [ ] Test with various discipline and clan icons
  - [ ] Verify icons render correctly in light/dark mode

- [ ] **Fix card hover preview:**
  - [ ] Add image preloading when deck loads
  - [ ] Replace conditional render with opacity transition
  - [ ] OR implement with floating-ui library
  - [ ] OR use pure CSS group-hover approach
  - [ ] Test hover is smooth without flicker
  - [ ] Ensure preview doesn't overflow viewport

- [ ] **General polish:**
  - [ ] Test on mobile (hover may not work - consider tap-to-preview)
  - [ ] Verify all icons load from KRCG CDN
  - [ ] Check console for 404 errors on icon URLs

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/vtes/VtesIcon.tsx` | Remove harsh filter, add drop-shadow, adjust sizes |
| `src/app/vtes/decks/[id]/page.tsx` | Add image preloading, fix hover preview implementation |

### Estimated Complexity
- Icon fix: Simple (CSS changes)
- Hover fix: Medium (may need library or restructure)

---

## Phase 1: Enhanced Session Logging

### Objective
Capture VTES-specific game data for meaningful statistics.

### Database Migration (`migrations/12_vtes_sessions_enhanced.sql`)

```sql
-- 1. Add deck reference and seating to session_players
ALTER TABLE session_players
  ADD COLUMN IF NOT EXISTS deck_id UUID REFERENCES decks(id),
  ADD COLUMN IF NOT EXISTS seat_position INTEGER CHECK (seat_position BETWEEN 1 AND 6);

-- 2. Add deck reference to guest_players
ALTER TABLE guest_players
  ADD COLUMN IF NOT EXISTS deck_id UUID REFERENCES decks(id),
  ADD COLUMN IF NOT EXISTS seat_position INTEGER CHECK (seat_position BETWEEN 1 AND 6);

-- 3. Create oust tracking table
CREATE TABLE IF NOT EXISTS session_ousts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  ouster_id UUID, -- session_player or guest_player who ousted
  ouster_is_guest BOOLEAN DEFAULT false,
  ousted_id UUID NOT NULL, -- session_player or guest_player who was ousted
  ousted_is_guest BOOLEAN DEFAULT false,
  oust_order INTEGER NOT NULL, -- 1st oust, 2nd oust, etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Add game context to sessions
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS game_type TEXT DEFAULT 'casual' CHECK (game_type IN ('casual', 'tournament_prelim', 'tournament_final', 'league')),
  ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER DEFAULT 120,
  ADD COLUMN IF NOT EXISTS table_swept BOOLEAN DEFAULT false;

-- 5. RLS for session_ousts
ALTER TABLE session_ousts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ousts from their group sessions"
  ON session_ousts FOR SELECT
  USING (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN groups g ON s.group_id = g.id
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert ousts for their sessions"
  ON session_ousts FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM sessions WHERE created_by = auth.uid()
    )
  );
```

### UI Changes

#### File: `src/app/vtes/sessions/new/page.tsx`

**Add seating order:**
- Visual circular table representation (6 seats)
- Drag-and-drop or number input for seat assignment
- Auto-calculate predator/prey based on seating

**Add oust tracking:**
- Sequential oust entry (who ousted whom, in order)
- Auto-fill VP when player is ousted (typically 0 unless GW)

**Add game context:**
- Game type dropdown (Casual, Tournament Prelim, Tournament Final, League)
- Time limit input (default 120 min)
- "Table Sweep" checkbox

**Enhanced player row:**
```typescript
interface PlayerEntry {
  id: string;
  type: 'registered' | 'guest';
  name: string;
  userId?: string;        // for registered
  deckId?: string;        // linked deck (optional)
  deckName: string;       // always required (text fallback)
  seatPosition: number;   // 1-6
  vp: number;
  isWinner: boolean;
  wasOusted: boolean;
  oustedBy?: string;      // player id who ousted them
}
```

### Tasks

- [ ] Create migration `12_vtes_sessions_enhanced.sql`
- [ ] Run migration on Supabase
- [ ] Update `src/app/vtes/sessions/new/page.tsx`:
  - [ ] Add seating position UI (circular table or numbered inputs)
  - [ ] Add deck selector dropdown (fetch user's decks)
  - [ ] Add game type selector
  - [ ] Add oust tracking section
  - [ ] Update form submission to save new fields
- [ ] Update `src/app/vtes/sessions/page.tsx`:
  - [ ] Display seating order in session cards
  - [ ] Show oust chain if available
  - [ ] Add game type badge

### Estimated Complexity
- Migration: Simple
- UI Changes: Medium (seating visualization)
- Form Logic: Medium (oust tracking state management)

---

## Phase 2: Session Filtering & My Sessions

### Objective
Allow users to find and filter their game history.

### UI Changes

#### File: `src/app/vtes/sessions/page.tsx`

**Add filters:**
- Date range picker (from/to)
- Player filter (dropdown of group members)
- Deck filter (dropdown of user's decks)
- Game type filter
- Result filter (Won / Played / All)

**Add tabs:**
- "My Sessions" - games where current user played
- "All Sessions" - all group games

**Add sorting:**
- By date (default, newest first)
- By VP earned
- By game type

### New Hook: `src/hooks/useVtesSessions.ts`

```typescript
interface VtesSessionFilters {
  playerId?: string;
  deckId?: string;
  gameType?: 'casual' | 'tournament_prelim' | 'tournament_final' | 'league';
  dateFrom?: Date;
  dateTo?: Date;
  onlyWins?: boolean;
  onlyMyGames?: boolean;
}

function useVtesSessions(filters: VtesSessionFilters) {
  // Returns filtered, paginated sessions
  // Includes oust data and seating
}
```

### Tasks

- [ ] Create `src/hooks/useVtesSessions.ts`
- [ ] Update `src/app/vtes/sessions/page.tsx`:
  - [ ] Add filter bar component
  - [ ] Add "My Sessions" / "All Sessions" tabs
  - [ ] Implement client-side filtering (or server if large dataset)
  - [ ] Add pagination (10/25/50 per page)
- [ ] Create reusable `SessionFilters` component

### Estimated Complexity
- Hook: Simple
- UI: Medium (filter bar design)

---

## Phase 3: Basic Leaderboard

### Objective
Display player rankings based on VTES performance.

### New Page: `src/app/vtes/leaderboard/page.tsx`

**Metrics to display:**
| Metric | Description |
|--------|-------------|
| Total VP | Sum of all victory points |
| Games Won | Count of games where is_winner = true |
| Games Played | Total game count |
| Win Rate | Games Won / Games Played |
| VP/Game | Total VP / Games Played |
| Oust Rate | Players ousted / Games Played |

**UI Layout:**
- Table with sortable columns
- Player avatar/name link to profile
- Time period filter (All Time, This Month, This Year)
- Game type filter (All, Casual Only, Tournament Only)

### New Hook: `src/hooks/useVtesLeaderboard.ts`

```typescript
interface LeaderboardEntry {
  playerId: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  totalVp: number;
  gamesWon: number;
  gamesPlayed: number;
  winRate: number;
  vpPerGame: number;
  oustRate: number;
}

interface LeaderboardFilters {
  period?: 'all' | 'month' | 'year';
  gameType?: 'all' | 'casual' | 'tournament';
  minGames?: number; // Exclude players with < N games
}

function useVtesLeaderboard(filters: LeaderboardFilters): LeaderboardEntry[]
```

### Database View (Optional Optimization)

```sql
-- Create materialized view for leaderboard if performance needed
CREATE MATERIALIZED VIEW vtes_player_stats AS
SELECT
  p.user_id,
  COUNT(DISTINCT sp.session_id) as games_played,
  COUNT(DISTINCT sp.session_id) FILTER (WHERE sp.is_winner) as games_won,
  COALESCE(SUM(sp.score), 0) as total_vp,
  -- Add more aggregations
FROM session_players sp
JOIN sessions s ON sp.session_id = s.id
JOIN profiles p ON sp.user_id = p.user_id
WHERE s.game_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' -- VTES game ID
GROUP BY p.user_id;
```

### Tasks

- [ ] Create `src/hooks/useVtesLeaderboard.ts`
- [ ] Create `src/app/vtes/leaderboard/page.tsx`:
  - [ ] Leaderboard table component
  - [ ] Period filter (All/Month/Year)
  - [ ] Game type filter
  - [ ] Sortable columns
  - [ ] Minimum games threshold option
- [ ] Add leaderboard link to VTES dashboard
- [ ] Add leaderboard link to sidebar navigation

### Estimated Complexity
- Hook: Medium (aggregation queries)
- UI: Simple (table with filters)

---

## Phase 4: Deck Statistics

### Objective
Track deck performance across games.

### New Page: `src/app/vtes/decks/[id]/stats/page.tsx`

**Or add stats tab to existing deck detail page.**

**Metrics per deck:**
| Metric | Description |
|--------|-------------|
| Games Played | Times this deck was used |
| Wins | Games won with this deck |
| Win Rate | Wins / Games Played |
| Total VP | Sum of VP earned |
| VP/Game | Average VP per game |
| Best Result | Highest VP in single game |
| Last Played | Most recent game date |

**Additional insights:**
- Performance by seat position (1-6)
- Performance by opponent count (3/4/5 player tables)
- Performance trend over time (chart)

### Database Query

```sql
-- Get deck stats
SELECT
  d.id as deck_id,
  d.name as deck_name,
  COUNT(sp.id) as games_played,
  COUNT(sp.id) FILTER (WHERE sp.is_winner) as wins,
  COALESCE(SUM(sp.score), 0) as total_vp,
  MAX(sp.score) as best_result,
  MAX(s.played_at) as last_played
FROM decks d
LEFT JOIN session_players sp ON sp.deck_id = d.id
LEFT JOIN sessions s ON sp.session_id = s.id
WHERE d.id = $1
GROUP BY d.id, d.name;
```

### Tasks

- [ ] Create `src/hooks/useDeckStats.ts`
- [ ] Add stats section to `src/app/vtes/decks/[id]/page.tsx`:
  - [ ] Stats summary cards
  - [ ] Game history list for this deck
  - [ ] Performance chart (optional)
- [ ] Update deck list to show quick stats (games played, win rate)

### Estimated Complexity
- Hook: Simple
- UI: Medium

---

## Phase 5: Deck Management Enhancements

### Objective
Allow deck editing, cloning, and organization.

### Features

#### 5.1 Deck Editing

**File: `src/app/vtes/decks/[id]/edit/page.tsx`**

- Load existing deck cards
- Add/remove cards (KRCG search integration)
- Adjust quantities
- Save changes (update `deck_cards` table)
- Only owner can edit

#### 5.2 Deck Cloning

**Add "Clone Deck" button to deck detail page:**
- Creates copy with "(Copy)" suffix
- Copies all deck_cards
- Sets current user as owner
- Redirects to edit page

#### 5.3 Deck Archetype Tags

**Database migration:**
```sql
CREATE TABLE deck_archetypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT -- for UI badge color
);

INSERT INTO deck_archetypes (name, description, color) VALUES
  ('Stealth Bleed', 'Bleeds with stealth actions', 'purple'),
  ('Wall', 'Defensive intercept/combat', 'blue'),
  ('Bruise Bleed', 'Combat + bleed hybrid', 'red'),
  ('Swarm', 'Many small vampires', 'green'),
  ('Powerbleed', 'Big capacity bleed', 'orange'),
  ('Toolbox', 'Versatile multi-strategy', 'gray'),
  ('Vote', 'Political actions', 'yellow'),
  ('Ally', 'Ally-based strategy', 'teal');

ALTER TABLE decks ADD COLUMN archetype_id UUID REFERENCES deck_archetypes(id);
```

**UI:**
- Archetype selector in deck edit/import
- Archetype badge on deck cards
- Filter by archetype in deck browser

#### 5.4 Re-enable Privacy Toggle

- Fix the commented-out privacy toggle in import page
- Add privacy toggle to deck edit page
- Test RLS policies work correctly

### Tasks

- [ ] Create migration `13_deck_archetypes.sql`
- [ ] Create `src/app/vtes/decks/[id]/edit/page.tsx`:
  - [ ] Card search sidebar
  - [ ] Editable card list
  - [ ] Save/cancel buttons
  - [ ] Archetype selector
- [ ] Add clone functionality to deck detail
- [ ] Re-enable and test privacy toggle
- [ ] Update deck browser with archetype filter

### Estimated Complexity
- Deck Edit: High (complex state management)
- Clone: Simple
- Archetypes: Simple
- Privacy: Medium (RLS testing)

---

## Phase 6: Player Profile & Stats

### Objective
Dedicated player profile page with VTES statistics.

### New Page: `src/app/vtes/players/[id]/page.tsx`

**Sections:**
1. **Header**: Avatar, name, member since
2. **Quick Stats**: Games played, wins, VP total, favorite deck
3. **Recent Games**: Last 5 sessions with results
4. **Deck Collection**: Player's public decks
5. **Head-to-Head**: Record vs other players (optional)
6. **Achievements**: Badges for milestones (optional)

### Tasks

- [ ] Create `src/hooks/useVtesPlayerStats.ts`
- [ ] Create `src/app/vtes/players/[id]/page.tsx`
- [ ] Link player names in sessions/leaderboard to profile
- [ ] Add "My Profile" link to VTES dashboard

### Estimated Complexity
- Medium

---

## Phase 7: Advanced Analytics (Future)

### Potential Features

1. **Seat Position Analysis**
   - Win rate by seat (1-6)
   - VP by seat position
   - Identify if certain seats are advantageous

2. **Prey/Predator Matchups**
   - Track who was predator/prey in each game
   - Calculate success rate vs specific players
   - Identify favorable/unfavorable matchups

3. **Deck Archetype Meta**
   - Which archetypes are winning most
   - Archetype vs archetype win rates
   - Meta trends over time

4. **Time-based Analysis**
   - Performance by day of week
   - Performance trend over months
   - Winning streaks / losing streaks

### Database Requirements

Would need additional tracking:
- Detailed game state snapshots
- Turn-by-turn VP tracking (if desired)
- More robust oust chain data

---

## Phase 8: Tournament Mode (Future)

### Features

1. **Tournament Creation**
   - Name, date, format (standard, limited, etc.)
   - Player registration
   - Number of prelim rounds

2. **Round Management**
   - Table assignments (random or seeded)
   - Score entry per table
   - Automatic advancement calculation

3. **Standings**
   - Current standings display
   - Tiebreaker rules
   - Final table qualification

4. **Final Table**
   - Separate final table session
   - Tournament winner declaration

### Database Schema (Sketch)

```sql
CREATE TABLE tournaments (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  format TEXT DEFAULT 'standard',
  prelim_rounds INTEGER DEFAULT 3,
  players_to_finals INTEGER DEFAULT 5,
  status TEXT DEFAULT 'registration', -- registration, in_progress, complete
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE tournament_players (
  id UUID PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id),
  user_id UUID REFERENCES auth.users(id),
  -- OR guest info
  guest_name TEXT,
  seed INTEGER, -- for seeded tournaments
  total_vp NUMERIC DEFAULT 0,
  total_gw INTEGER DEFAULT 0,
  final_rank INTEGER
);

CREATE TABLE tournament_rounds (
  id UUID PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id),
  round_number INTEGER NOT NULL,
  is_final BOOLEAN DEFAULT false
);

CREATE TABLE tournament_tables (
  id UUID PRIMARY KEY,
  round_id UUID REFERENCES tournament_rounds(id),
  table_number INTEGER NOT NULL,
  session_id UUID REFERENCES sessions(id) -- links to actual game
);
```

---

## Implementation Priority

### Immediate (This Sprint)
0. **Phase 0**: UI Polish (Bug Fixes)
   - Fix icon rendering (remove harsh filter, add drop-shadow)
   - Fix card hover flicker (preload images, smooth transitions)
   - Quick wins that improve user experience immediately

1. **Phase 1**: Enhanced Session Logging
   - Critical for collecting useful data
   - Foundation for all statistics

### Short-term (Next 2 Sprints)
2. **Phase 2**: Session Filtering
3. **Phase 3**: Basic Leaderboard
   - High user value
   - Relatively simple to implement

### Medium-term
4. **Phase 4**: Deck Statistics
5. **Phase 5**: Deck Management
6. **Phase 6**: Player Profiles

### Long-term
7. **Phase 7**: Advanced Analytics
8. **Phase 8**: Tournament Mode

---

## Technical Notes

### VTES Game ID
```
a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
```

### Key Files to Modify
- `src/app/vtes/sessions/new/page.tsx` - Session form
- `src/app/vtes/sessions/page.tsx` - Session list
- `src/app/vtes/decks/[id]/page.tsx` - Deck detail
- `src/hooks/` - New data hooks

### Testing Strategy
- Unit tests for utility functions (vitest)
- E2E tests for critical flows (Playwright)
  - Session creation with seating
  - Leaderboard calculation
  - Deck stats accuracy

### Performance Considerations
- Consider materialized views for leaderboard if > 1000 sessions
- Paginate session lists
- Cache KRCG API responses (already has 15-min cache)

---

## Changelog

| Date | Phase | Changes |
|------|-------|---------|
| 2026-01-18 | 3 | Created leaderboard page with sortable rankings |
| 2026-01-18 | 1 | Enhanced session form: game type, table sweep, deck linking, seat position |
| 2026-01-18 | 1 | Updated session list to show game type badges and seat positions |
| 2026-01-18 | 1 | Created migration `12_vtes_sessions_enhanced.sql` |
| 2026-01-18 | 0 | Added Phase 0: UI Polish - icon fixes and hover flicker fixes |
| 2026-01-18 | - | Initial plan created |

