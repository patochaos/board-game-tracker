# UX/UI & Mobile Implementation Plan

**Created:** January 29, 2026  
**Target:** Coding Agent  
**Scope:** Mobile-first UX improvements for Board Game Tracker

---

## How to Use This Plan

Each task is self-contained with:
- **What:** The specific change to make
- **Why:** The reasoning and user benefit
- **Where:** File paths and components affected
- **How:** Implementation details and considerations
- **Acceptance Criteria:** How to verify the change is complete

Execute tasks in order within each phase. Run `npm run build` after each major change to catch type errors.

---

## Phase 1: Critical Mobile Navigation

### Task 1.1: Create Bottom Navigation Component

**What:**  
Create a new `BottomNav` component that provides fixed navigation at the bottom of the screen on mobile devices.

**Why:**  
Currently, mobile users must:
1. Tap hamburger icon (top-left)
2. Wait for sidebar animation
3. Find and tap their destination
4. Wait for sidebar to close

This is 3-4 taps for basic navigation. A bottom nav reduces this to 1 tap, matching user expectations from apps like Instagram, Spotify, and most mobile games. Studies show bottom navigation increases engagement by 15-30% on mobile.

**Where:**
- Create: `src/components/layout/bottom-nav.tsx`
- Modify: `src/components/layout/app-layout.tsx`

**How:**

1. Create `bottom-nav.tsx` with these specifications:
   - Fixed position at bottom (`fixed bottom-0 left-0 right-0`)
   - Only visible on mobile (`lg:hidden`)
   - Safe area padding for notched phones (`pb-safe` or `padding-bottom: env(safe-area-inset-bottom)`)
   - 5 navigation items: Dashboard, Games, Sessions, Players, Stats
   - Use same icons as sidebar: `LayoutDashboard`, `Dice5`, `CalendarDays`, `Users`, `Trophy`
   - Active state matches current route (use `usePathname`)
   - Background: `bg-slate-900/95 backdrop-blur-xl border-t border-slate-800`
   - Height: approximately 64px plus safe area
   - Each item: icon (24px) + label (10-11px text) stacked vertically
   - Active item: `text-wood-400` with subtle glow or dot indicator
   - Inactive items: `text-slate-500`

2. Modify `app-layout.tsx`:
   - Import and render `<BottomNav />` after the main content
   - Add `pb-20 lg:pb-0` to main content to prevent overlap with bottom nav
   - The bottom nav handles its own visibility (lg:hidden)

3. Theme support:
   - Check if on VTES routes (`pathname.startsWith('/vtes')`)
   - Use red theme for VTES, wood theme for board games (same as sidebar)

**Acceptance Criteria:**
- [ ] Bottom nav appears only on screens < 1024px wide
- [ ] Tapping an item navigates to the correct page
- [ ] Current page is visually highlighted
- [ ] Content doesn't get hidden behind the nav
- [ ] Works correctly on iPhone with notch/dynamic island
- [ ] Smooth transitions between active states

---

### Task 1.2: Create Floating Action Button (FAB)

**What:**  
Add a floating action button for "Log New Session" that's always accessible on mobile.

**Why:**  
Logging a game session is the #1 action users take. Currently it requires:
1. Navigate to Sessions or Dashboard
2. Find the "Log New Session" button
3. Tap it

A FAB makes the primary action always 1 tap away, regardless of current page. This is a well-established mobile pattern (Gmail compose, Google Maps, etc.) that significantly improves task completion rates.

**Where:**
- Create: `src/components/ui/fab.tsx`
- Modify: `src/components/layout/app-layout.tsx`
- Export from: `src/components/ui/index.ts`

**How:**

1. Create `fab.tsx`:
   ```
   Props:
   - href: string (link destination)
   - icon: ReactNode
   - label?: string (for accessibility)
   - variant?: 'primary' | 'secondary'
   ```
   
   Styling:
   - Fixed position: `fixed bottom-24 right-4 lg:hidden` (above bottom nav)
   - Size: 56x56px (standard FAB size, meets 44px minimum)
   - Shape: `rounded-full`
   - Shadow: `shadow-lg shadow-wood-500/30`
   - Background: `bg-gradient-to-r from-wood-500 to-wood-600`
   - Icon: centered, white, 24px
   - Z-index: above content but below modals (`z-40`)
   - Add subtle pulse animation for first-time users (optional)

2. Modify `app-layout.tsx`:
   - Import FAB component
   - Render FAB with `href="/sessions/new"` and Plus icon
   - Only show when user is authenticated (check route isn't /login, /register)
   - Hide on `/sessions/new` page itself (already there)

3. Accessibility:
   - `aria-label="Log new game session"`
   - Focus-visible ring for keyboard users

**Acceptance Criteria:**
- [ ] FAB visible on all mobile pages except /sessions/new and auth pages
- [ ] Tapping FAB navigates to /sessions/new
- [ ] FAB doesn't overlap with bottom nav
- [ ] FAB has proper shadow and looks "floating"
- [ ] Hidden on desktop (lg and above)

---

### Task 1.3: Increase Touch Target Sizes

**What:**  
Audit and increase all interactive elements to meet the 44x44px minimum touch target guideline.

**Why:**  
Apple's Human Interface Guidelines and Google's Material Design both recommend 44-48px minimum touch targets. Smaller targets cause:
- Frustration from mis-taps
- Slower task completion
- Accessibility issues for users with motor impairments

Current issues identified:
- Player row trophy button: `p-2` with 16px icon = ~32px total
- Player row delete button: `p-2` with 16px icon = ~32px total
- Score input: `w-20` is fine for width but height may be small
- Filter buttons in sessions list

**Where:**
- `src/app/(apps)/bg-tracker/sessions/new/page.tsx` - Player row buttons
- `src/app/(apps)/bg-tracker/sessions/page.tsx` - Filter controls
- `src/components/ui/button.tsx` - Base button sizes

**How:**

1. Update button sizes in `button.tsx`:
   - Change `btn-sm`: from `px-3 py-1.5` to `px-3 py-2 min-h-[44px]`
   - Ensure `btn-md` meets 44px height: `px-4 py-2.5 min-h-[44px]`
   - Keep `btn-lg` as is (already large enough)

2. Update player row in `sessions/new/page.tsx`:
   - Trophy toggle button: change from `p-2` to `p-3` (48px with icon)
   - Delete button: change from `p-2` to `p-3`
   - Consider making the entire player row tappable to edit

3. Update filter controls in `sessions/page.tsx`:
   - Ensure select dropdowns have adequate height
   - Date inputs should be at least 44px tall

4. General audit:
   - Search for `p-2` on icon-only buttons and increase to `p-3`
   - Ensure all clickable list items have adequate padding

**Acceptance Criteria:**
- [ ] All buttons are at least 44px in their smallest dimension
- [ ] Trophy and delete buttons in player list are easily tappable
- [ ] No more accidental mis-taps on common actions
- [ ] Verify with browser dev tools touch simulation

---

### Task 1.4: Collapse Filters by Default on Mobile

**What:**  
On the Sessions page, hide the filter panel by default on mobile devices and show only when explicitly opened.

**Why:**  
The filter panel takes up valuable screen real estate on mobile. Most users want to see their sessions immediately, not filters. By collapsing it:
- Users see more content on initial load
- Filters are still accessible (1 tap away)
- Matches expectations from e-commerce and content apps

**Where:**
- `src/app/(apps)/bg-tracker/sessions/page.tsx`

**How:**

1. Add window width detection or use CSS approach:
   
   Option A (CSS-only, preferred):
   - Keep `showFilters` state as is
   - Add responsive classes to filter card: `hidden lg:block` when closed on mobile
   - Show compact filter indicator on mobile when filters are active
   
   Option B (JS approach):
   - Initialize `showFilters` based on window width
   - Use `useEffect` to check `window.innerWidth >= 1024`
   - Default to `false` on mobile, `true` on desktop

2. Improve mobile filter toggle:
   - When filters are active but hidden, show count badge more prominently
   - Consider a bottom sheet pattern for filters on mobile (future enhancement)

3. Add "Active filters" chip row when collapsed:
   - If `hasActiveFilters && !showFilters`, show a row of dismissible chips
   - Each chip shows filter value and X to clear

**Acceptance Criteria:**
- [ ] Filters hidden by default on mobile (< 1024px)
- [ ] Filters visible by default on desktop (>= 1024px)
- [ ] Filter button clearly shows when filters are active
- [ ] Active filters visible as chips when panel is collapsed

---

## Phase 2: Form & Interaction Improvements

### Task 2.1: Add Search to Game Selection

**What:**  
Add an inline search/filter input to the game selection grid in the New Session form.

**Why:**  
Users with large game collections (50+ games) must scroll through the entire grid to find their game. This causes:
- Frustration and time waste
- Increased form abandonment
- Poor mobile experience (lots of scrolling)

A search field allows users to type 2-3 characters and immediately find their game.

**Where:**
- `src/app/(apps)/bg-tracker/sessions/new/page.tsx`

**How:**

1. Add state for game search:
   ```typescript
   const [gameSearch, setGameSearch] = useState('');
   ```

2. Filter games based on search:
   ```typescript
   const filteredGames = games.filter(game => 
     game.name.toLowerCase().includes(gameSearch.toLowerCase())
   );
   ```

3. Add search input above game grid:
   - Use existing Input component with Search icon
   - Placeholder: "Search your games..."
   - Clear button when text is entered
   - Sticky positioning so it stays visible while scrolling

4. Show "Recently Played" section:
   - Query last 5 distinct games from user's sessions
   - Show these first, before the full alphabetical list
   - Label: "Recently Played" with small divider

5. Handle empty state:
   - If search returns no results, show "No games match '{search}'"
   - Suggest using BGG search modal to add new game

**Acceptance Criteria:**
- [ ] Search input appears above game grid
- [ ] Typing filters games in real-time
- [ ] Recently played games shown first
- [ ] Clear button clears search
- [ ] Works on mobile with keyboard appearing

---

### Task 2.2: Recent Players Quick-Add

**What:**  
Show previously played-with players as quick-select chips, allowing 1-tap addition instead of typing names.

**Why:**  
Most game groups have the same 4-8 regular players. Currently, users must type each guest player's name every time. This is:
- Tedious and error-prone
- Causes typos ("Jon" vs "John")
- Slows down the most common use case

Quick-add chips reduce player entry from 10+ taps to 2-3 taps.

**Where:**
- `src/app/(apps)/bg-tracker/sessions/new/page.tsx`

**How:**

1. Fetch recent guest players on page load:
   ```typescript
   // Query unique guest player names from last 20 sessions
   const { data: recentGuests } = await supabase
     .from('guest_players')
     .select('name')
     .order('created_at', { ascending: false })
     .limit(50);
   
   // Deduplicate by name
   const uniqueGuests = [...new Set(recentGuests?.map(g => g.name))].slice(0, 8);
   ```

2. Add state for recent players:
   ```typescript
   const [recentPlayers, setRecentPlayers] = useState<string[]>([]);
   ```

3. Display chips above the player list:
   - Horizontal scrollable row
   - Each chip shows player name
   - Tapping chip adds player to the list
   - Chip becomes disabled/checked when player already added
   - Label: "Quick add:" or "Recent players:"

4. Add "Same as last time" button:
   - Fetches players from user's most recent session
   - One tap adds all of them
   - Shows confirmation: "Added 4 players"

5. Style chips:
   - Use existing badge styling or create pill buttons
   - Background: `bg-slate-800 hover:bg-slate-700`
   - Active/added state: `bg-emerald-500/20 text-emerald-400`

**Acceptance Criteria:**
- [ ] Recent player names appear as tappable chips
- [ ] Tapping adds player to list
- [ ] Already-added players are visually distinct
- [ ] "Same as last time" adds previous session's players
- [ ] Empty state if no previous players

---

### Task 2.3: Smart Form Defaults

**What:**  
Pre-fill form fields with intelligent defaults based on user history.

**Why:**  
Reducing the number of fields users need to fill in directly improves completion rates. Smart defaults:
- Save time (fewer taps)
- Reduce cognitive load
- Make the app feel "smart" and personalized

**Where:**
- `src/app/(apps)/bg-tracker/sessions/new/page.tsx`

**How:**

1. Date default (already done, but verify):
   - Default to today's date ✓
   - If it's before noon, suggest yesterday (common pattern for logging previous night's games)

2. Duration default:
   - Store last used duration per game
   - When game is selected, pre-fill with that game's average duration
   - Show as placeholder, not value (user can still leave blank)

3. Location default:
   - Remember last 3 locations used
   - Show as quick-select chips below location input
   - Most recent first

4. Expansion defaults (already done):
   - Pre-select expansions from last session with this game ✓

5. Implementation:
   - Use localStorage for client-side persistence:
     ```typescript
     const STORAGE_KEY = 'session-form-preferences';
     interface FormPreferences {
       recentLocations: string[];
       gameDurations: Record<string, number>;
       lastPlayers: string[];
     }
     ```
   - Load preferences on mount
   - Save preferences on successful form submission

**Acceptance Criteria:**
- [ ] Date defaults to today
- [ ] Recent locations shown as chips
- [ ] Game duration suggested based on history
- [ ] Preferences persist across browser sessions

---

## Phase 3: Visual Polish & Feedback

### Task 3.1: Consistent Loading Skeletons

**What:**  
Create and apply consistent skeleton loading states across all list views.

**Why:**  
Skeleton screens:
- Reduce perceived loading time by 30-40%
- Provide spatial preview of content structure
- Feel more polished than spinners
- Prevent layout shift when content loads

Currently, some pages have skeletons (Games, Sessions) but others use spinners or blank states.

**Where:**
- Audit: `src/app/(apps)/bg-tracker/dashboard/page.tsx`
- Audit: `src/app/(apps)/bg-tracker/stats/page.tsx`
- Audit: `src/app/(apps)/bg-tracker/leaderboard/page.tsx`
- Existing: `src/components/ui/skeleton.tsx`

**How:**

1. Review existing `skeleton.tsx` and ensure it exports:
   - `Skeleton` - base shimmer component
   - `GameListSkeleton` - for game grids
   - `SessionListSkeleton` - for session cards

2. Create new skeletons as needed:
   - `StatCardSkeleton` - single stat card placeholder
   - `DashboardSkeleton` - full dashboard layout
   - `LeaderboardSkeleton` - player ranking list

3. Apply skeletons to pages:
   - Dashboard: show skeleton for stat cards and recent sessions
   - Stats: show skeleton for charts and leaderboard
   - Wrap in loading check: `{loading ? <Skeleton /> : <Content />}`

4. Skeleton styling:
   - Match exact dimensions of final content
   - Use `animate-pulse` with `bg-slate-800`
   - Rounded corners matching content (`rounded-xl`, `rounded-2xl`)

**Acceptance Criteria:**
- [ ] All list pages show skeletons during load
- [ ] Skeletons match layout of actual content
- [ ] No layout shift when content replaces skeleton
- [ ] Consistent animation timing across all skeletons

---

### Task 3.2: Success Animations & Feedback

**What:**  
Add visual feedback animations for successful actions.

**Why:**  
Feedback confirms to users that their action was received and processed. Without it:
- Users may tap buttons multiple times
- Uncertainty causes anxiety
- App feels unresponsive

Good feedback includes:
- Visual confirmation (checkmark, color change)
- Motion (subtle animation)
- Optional: haptic feedback on supported devices

**Where:**
- `src/app/(apps)/bg-tracker/sessions/new/page.tsx` - Session save
- `src/app/(apps)/bg-tracker/games/page.tsx` - Game add
- Create: `src/components/ui/success-animation.tsx`
- Consider: `sonner` toast library (already installed)

**How:**

1. Session save success:
   - After successful save, before redirect, show brief success state
   - Options:
     a. Full-screen overlay with checkmark animation (300ms)
     b. Toast notification with success message
     c. Button transforms to checkmark briefly
   - Recommended: Use `sonner` toast (already in project) with custom success styling

2. Game add success:
   - Button already changes to "Added" with checkmark ✓
   - Add subtle scale animation on state change
   - Consider confetti for first game added (use existing canvas-confetti)

3. Create reusable success animation component:
   ```typescript
   // For inline success indicators
   <SuccessCheck show={success} onComplete={() => setSuccess(false)} />
   ```
   - Green checkmark that scales in
   - Auto-hides after 1.5 seconds
   - CSS animation, no JS libraries needed

4. Toast improvements:
   - Ensure toast appears above bottom nav on mobile
   - Position: `top-center` on mobile, `bottom-right` on desktop

**Acceptance Criteria:**
- [ ] Session save shows clear success feedback
- [ ] Game add has satisfying visual confirmation
- [ ] Toasts visible and not obscured by navigation
- [ ] Animations are subtle and quick (< 500ms)

---

### Task 3.3: Improve Text Contrast

**What:**  
Audit and improve color contrast for all text elements, especially muted/secondary text.

**Why:**  
WCAG 2.1 Level AA requires:
- 4.5:1 contrast ratio for normal text
- 3:1 for large text (18px+ or 14px+ bold)

`text-slate-500` on `bg-slate-900` may not meet these ratios, causing:
- Readability issues in bright environments
- Accessibility failures
- Eye strain during extended use

**Where:**
- Global: `src/app/globals.css`
- Components using `text-slate-500` or `text-slate-600`

**How:**

1. Audit current usage:
   - Search codebase for `text-slate-500`, `text-slate-600`
   - Check each usage context (background color)

2. Recommended replacements:
   - `text-slate-500` → `text-slate-400` for secondary text
   - `text-slate-600` → `text-slate-500` for subtle hints
   - Keep `text-slate-500` only for truly decorative elements

3. Specific fixes:
   - Session card date: ensure readable
   - Player score in parentheses: ensure readable
   - Form labels: should be `text-slate-300`
   - Placeholder text: can remain dimmer (not content)

4. Create semantic color classes in globals.css:
   ```css
   .text-muted { @apply text-slate-400; }
   .text-subtle { @apply text-slate-500; }
   ```
   - Migrate usages to semantic classes for consistency

5. Verification:
   - Use browser contrast checker extension
   - Test on mobile in bright outdoor lighting

**Acceptance Criteria:**
- [ ] All readable text meets 4.5:1 contrast
- [ ] Secondary text changed from slate-500 to slate-400
- [ ] No accessibility warnings in Lighthouse audit
- [ ] Text readable in bright environments

---

### Task 3.4: List Item Stagger Animations

**What:**  
Add staggered entrance animations when lists of items load.

**Why:**  
Stagger animations:
- Draw attention to new content
- Create a sense of polish and quality
- Guide the eye through the interface
- Make loading feel faster (progressive reveal)

Currently, lists appear all at once which feels abrupt.

**Where:**
- `src/app/(apps)/bg-tracker/sessions/page.tsx` - Session list
- `src/app/(apps)/bg-tracker/games/page.tsx` - Game list
- `src/app/(apps)/bg-tracker/stats/page.tsx` - Leaderboard

**How:**

1. Use existing stagger utilities in `globals.css`:
   ```css
   .stagger-1 { animation-delay: 0.1s; }
   .stagger-2 { animation-delay: 0.2s; }
   /* etc. */
   ```

2. Apply to list items:
   ```tsx
   {sessions.map((session, index) => (
     <Card
       key={session.id}
       className={cn(
         'animate-fade-in opacity-0',
         `stagger-${Math.min(index + 1, 5)}`  // Cap at 5 for performance
       )}
       style={{ animationFillMode: 'forwards' }}
     >
   ```

3. Consider `framer-motion` for more control (optional):
   - Only if already installed
   - Provides `AnimatePresence` for exit animations
   - Can be heavier, evaluate bundle impact

4. Performance considerations:
   - Only animate first 5-10 items
   - Items beyond visible viewport don't need animation
   - Use `will-change: opacity, transform` sparingly

5. Respect reduced motion preference:
   ```css
   @media (prefers-reduced-motion: reduce) {
     .animate-fade-in { animation: none; opacity: 1; }
   }
   ```

**Acceptance Criteria:**
- [ ] List items animate in with stagger effect
- [ ] Animation is subtle and quick
- [ ] No performance issues on long lists
- [ ] Respects prefers-reduced-motion

---

## Phase 4: Advanced Enhancements (Future)

These tasks are documented for future implementation but are lower priority.

### Task 4.1: Swipe Gestures on Cards

**Scope:** Add swipe-left-to-delete on session cards
**Library:** Consider `@use-gesture/react` or `framer-motion`
**Complexity:** Medium
**Benefit:** Faster deletion, matches mobile app patterns

### Task 4.2: Pull-to-Refresh

**Scope:** Add pull-to-refresh on list pages
**Implementation:** Custom hook or library
**Complexity:** Medium
**Benefit:** Familiar mobile pattern for refreshing data

### Task 4.3: PWA Support

**Scope:** Service worker, manifest, offline caching
**Files:** Create `public/manifest.json`, `src/app/sw.js`
**Complexity:** High
**Benefit:** App-like experience, offline support

### Task 4.4: Light Theme

**Scope:** System preference detection, theme toggle
**Files:** globals.css, new theme context
**Complexity:** Medium-High
**Benefit:** User preference, outdoor readability

---

## Testing Checklist

After implementing each phase, verify:

### Mobile Testing (Chrome DevTools + Real Device)
- [ ] iPhone SE (375px) - smallest common size
- [ ] iPhone 14 Pro (393px) - notch handling
- [ ] Android medium (360px)
- [ ] Tablet portrait (768px)

### Interaction Testing
- [ ] All buttons respond to touch
- [ ] No accidental triggers
- [ ] Forms work with mobile keyboard
- [ ] Modals scroll correctly

### Performance Testing
- [ ] Lighthouse mobile score > 80
- [ ] First contentful paint < 2s
- [ ] No janky animations

### Accessibility Testing
- [ ] VoiceOver/TalkBack basic navigation
- [ ] Keyboard navigation works
- [ ] Focus visible on all interactive elements

---

## Files Changed Summary

### New Files
- `src/components/layout/bottom-nav.tsx`
- `src/components/ui/fab.tsx`
- `src/components/ui/success-animation.tsx`

### Modified Files
- `src/components/layout/app-layout.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/index.ts`
- `src/app/(apps)/bg-tracker/sessions/page.tsx`
- `src/app/(apps)/bg-tracker/sessions/new/page.tsx`
- `src/app/(apps)/bg-tracker/games/page.tsx`
- `src/app/(apps)/bg-tracker/stats/page.tsx`
- `src/app/(apps)/bg-tracker/dashboard/page.tsx`
- `src/app/globals.css`

---

## Dependencies

No new dependencies required. All features can be built with:
- Existing Tailwind CSS utilities
- Existing Lucide React icons
- Existing Sonner toast library
- Existing canvas-confetti (for celebrations)

Optional additions if needed:
- `@use-gesture/react` - for swipe gestures (Phase 4)
- `framer-motion` - for advanced animations (optional)
