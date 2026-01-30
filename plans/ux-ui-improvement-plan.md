# UX/UI & Mobile-First Improvement Plan

**Generated:** January 29, 2026  
**Focus:** Usability, Mobile Experience, Visual Consistency

---

## Executive Summary

The Board Game Tracker has a solid foundation with a dark theme, glass-morphism cards, and responsive layouts. However, there are opportunities to improve mobile usability, reduce cognitive load, add microinteractions, and enhance overall polish.

---

## 🔴 High Priority Issues

### 1. Mobile Navigation Pain Points

**Current State:**
- Mobile sidebar requires hamburger menu tap → slide out → navigate → auto-close
- No persistent bottom navigation for quick access to main sections
- Session logging on mobile requires many scrolls

**Recommendations:**
- [ ] **Add Bottom Navigation Bar** for mobile (`lg:hidden`)
  - 5 tabs: Dashboard, Games, Sessions, Players, Stats
  - Fixed at bottom with `safe-area-inset-bottom` support
  - Active tab indicator with subtle animation
  - Keep sidebar for secondary items (Settings, Logout)

- [ ] **Floating Action Button (FAB)** for "Log Session"
  - Fixed bottom-right position
  - Most common action should be 1 tap away
  - Add subtle pulsing animation on dashboard for new users

### 2. Touch Target Sizes

**Current State:**
- Some buttons and interactive elements are small for mobile
- Player score input field is narrow (`w-20`)
- Trophy toggle button is small (`p-2`)

**Recommendations:**
- [ ] Minimum 44x44px touch targets (Apple HIG recommendation)
- [ ] Increase player row interactivity area
- [ ] Make entire session card tappable (already done ✓)
- [ ] Increase filter button sizes on mobile

### 3. Form Usability (New Session Page)

**Current State:**
- Game selection via grid can be overwhelming with many games
- No search/filter in game selection
- Expansion selection mixed with game selection flow
- Player entry requires typing on mobile (slow)

**Recommendations:**
- [ ] **Game Picker with Search**
  - Add search input at top of game grid
  - Show recently played games first
  - Sticky header with search
  
- [ ] **Smart Defaults**
  - Pre-select last played date if today
  - Remember last used players
  - Suggest common player configurations

- [ ] **Player Quick-Add**
  - Show recent players as quick-select chips
  - "Add same players as last time" button
  - Guest player autocomplete from history

### 4. Loading States & Skeleton Screens

**Current State:**
- Some pages have good skeletons (GameListSkeleton, SessionListSkeleton)
- Others show blank or basic spinner

**Recommendations:**
- [ ] Consistent skeleton patterns across all list views
- [ ] Optimistic UI updates for session logging
- [ ] Progress indicators for BGG imports

---

## 🟡 Medium Priority Improvements

### 5. Visual Hierarchy & Information Density

**Current State:**
- Stats page shows too much information at once
- Dashboard cards are well-organized but could be denser
- Achievement grid can feel cramped on mobile

**Recommendations:**
- [ ] **Collapsible Sections** on Stats page
  - Let users expand sections they care about
  - Remember collapsed state in localStorage

- [ ] **Progressive Disclosure**
  - Show top 3-5 items, "Show More" for rest
  - Especially for achievements, leaderboard

- [ ] **Dashboard Personalization**
  - Highlight user's most relevant stats
  - Show streak/momentum indicators

### 6. Empty States

**Current State:**
- Good empty states exist with icons and CTAs
- Could be more engaging/educational

**Recommendations:**
- [ ] Add illustrations or animated icons
- [ ] Contextual tips ("Did you know you can import from BGG?")
- [ ] Progress indicators for onboarding steps

### 7. Microinteractions

**Current State:**
- Good hover effects on cards
- Transition animations present
- Missing feedback on some actions

**Recommendations:**
- [ ] **Success Animations**
  - Checkmark animation on session save
  - Confetti burst on achievements unlocked
  - Subtle haptic feedback on mobile (if supported)

- [ ] **List Item Animations**
  - Stagger animation on list load
  - Slide-out on delete
  - Expand animation for expansion lists

- [ ] **Button Feedback**
  - Scale-down on press (active state)
  - Loading shimmer while processing

### 8. Color & Contrast

**Current State:**
- Good dark theme with wood/felt accent colors
- Some text uses `text-slate-500` which can be hard to read

**Recommendations:**
- [ ] Audit contrast ratios (aim for WCAG AA)
- [ ] Increase muted text from `slate-500` to `slate-400`
- [ ] Add focus-visible rings for keyboard navigation

---

## 🟢 Nice-to-Have Enhancements

### 9. Gestures (Mobile)

**Recommendations:**
- [ ] **Swipe Actions on Session Cards**
  - Swipe left to delete
  - Swipe right to mark favorite
  
- [ ] **Pull-to-Refresh**
  - Sessions list
  - Games library

### 10. Offline Support (PWA)

**Current State:**
- PWA listed as upcoming feature

**Recommendations:**
- [ ] Service worker for caching
- [ ] Offline session drafts
- [ ] Sync indicator when back online
- [ ] App install prompt

### 11. Theming

**Current State:**
- Dark theme only
- Light theme listed as upcoming

**Recommendations:**
- [ ] System preference detection
- [ ] Theme toggle in settings
- [ ] Consider "auto" option (follows OS)

### 12. Accessibility

**Recommendations:**
- [ ] Semantic HTML improvements (landmarks, headings)
- [ ] Screen reader announcements for dynamic content
- [ ] Keyboard navigation testing
- [ ] Reduced motion preference support

---

## Component-Specific Improvements

### Sidebar Component

| Issue | Recommendation |
|-------|---------------|
| Collapse state not persisted | Save to localStorage |
| Mobile menu lacks close on ESC | Add keyboard handler |
| No active state for nested routes | Improve route matching |

### Session Card

| Issue | Recommendation |
|-------|---------------|
| Notes truncated without indicator | Add "..." or ellipsis icon |
| Date formatting inconsistent | Use relative dates consistently |
| Player pills wrap awkwardly | Limit to 3 shown + "+N more" |

### Game Grid (Selection)

| Issue | Recommendation |
|-------|---------------|
| No filtering | Add inline search |
| All games shown equally | Show recently played first |
| Expansion indicator missing | Add badge or icon |

### Stats Page

| Issue | Recommendation |
|-------|---------------|
| Too much scrolling | Collapsible sections |
| Weekly chart needs context | Add trend arrows |
| Table not mobile-friendly | Switch to cards on mobile |

---

## Mobile-Specific Layout Recommendations

### Recommended Breakpoint Usage

```
sm: 640px   - 2-column grids
md: 768px   - Tablets, increased padding
lg: 1024px  - Show sidebar, hide mobile nav
xl: 1280px  - Larger content widths
```

### Current Issues by Page

| Page | Mobile Issue | Fix |
|------|-------------|-----|
| Dashboard | Stats grid too cramped | 1 col on xs, 2 on sm |
| Sessions | Filter panel takes too much space | Collapse by default on mobile |
| Games | Search modal usable ✓ | - |
| Stats | Table requires horizontal scroll | Use cards instead |
| New Session | Long form, much scrolling | Multi-step wizard |

---

## Implementation Priority Order

### Phase 1: Critical Mobile UX (1-2 days)
1. Bottom navigation bar
2. Floating action button for "Log Session"
3. Touch target audit and fixes
4. Filter panel collapsed by default on mobile

### Phase 2: Form Improvements (1-2 days)
1. Game picker with search
2. Recent players quick-add
3. Smart defaults (remember last used)

### Phase 3: Visual Polish (1-2 days)
1. Loading state consistency
2. Microinteractions (success animations)
3. Contrast improvements

### Phase 4: Advanced Features (3+ days)
1. Swipe gestures
2. PWA/Offline support
3. Light theme
4. Accessibility audit

---

## VTES Guess Game Specific

**Current State:** Excellent mobile-first design with touch support

**Minor Improvements:**
- [ ] Larger option buttons for accessibility
- [ ] More visual feedback on incorrect answers
- [ ] Streak milestone celebrations
- [ ] Share image generation (canvas-based)

---

## Technical Debt Notes

1. **Supabase client creation** - Consider centralizing browser client
2. **Dynamic imports** - Some heavy components could be lazy-loaded
3. **Image optimization** - Ensure all BGG images use Next.js Image with proper sizing
4. **Bundle analysis** - Check for unused code/dependencies

---

## Questions for User

1. What's the primary device your users use? (Phone vs Desktop)
2. Are there specific pages that feel clunky on mobile?
3. Any specific features you want prioritized?
4. Do you have analytics on most-used features?
