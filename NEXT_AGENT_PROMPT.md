# Context: VTES Guess Game Mobile Redesign

## Status
- **Components Created:** 5/5 ✅
- **Main Page Refactor:** Pending (Priority)

## What Was Done
We created a mobile-first immersive layout with 5 new components:
- `Hud.tsx` - Top bar with score/streak/settings
- `CardStage.tsx` - Responsive card display with clamp() sizing
- `GameControls.tsx` - Answer grid + skip button
- `SettingsModal.tsx` - Bottom sheet for game settings
- `CardAttributesStrip.tsx` - Card info (cost, disciplines, type)

## Your Task: Refactor Main Page

**File:** `src/app/(apps)/vtes-guess/guess-card/page.tsx`

### Quick Reference

1. **Add imports** (top of file):
```tsx
import { Hud, CardStage, GameControls, SettingsModal } from '@/components/vtes/guess';
```

2. **Add state** (around line 93):
```tsx
const [isSettingsOpen, setIsSettingsOpen] = useState(false);
const [showDetails, setShowDetails] = useState(false);
```

3. **Add handler**:
```tsx
const handleGameModeChange = (mode: 'normal' | 'ranked') => {
  if (mode === 'ranked') {
    startRankedGame();
  } else {
    startNormalGame();
  }
  setIsSettingsOpen(false);
};
```

4. **Replace main container** (lines 807-1853):
   - Replace the old `div` with the new component structure shown in `plans/guess-game-mobile-redesign.md`

5. **Delete old UI sections**:
   - Header with title (lines 994-1015)
   - Mode toggle (lines 1017-1065)
   - Score/Streak display (lines 1067-1206)
   - Difficulty selector (lines 1208-1263)
   - Card type selector (lines 1265-1294)
   - Stats footer (lines 1796-1838)

### Testing
- Open dev tools (F12), toggle mobile view (Ctrl+Shift+M)
- Verify HUD, card, and controls are all visible without scrolling
- Test game flow (answer, skip, next card)

### Reference
Full details in: `plans/guess-game-mobile-redesign.md`
