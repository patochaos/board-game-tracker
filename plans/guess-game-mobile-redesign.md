# Game UI Redesign Plan - Mobile-First Immersive Layout

## Status: IN PROGRESS
**Components Created:** 5/5
**Next Step:** Refactor main page

## Completed Components
All components created in `src/components/vtes/guess/`:

| File | Status | Purpose |
|------|--------|---------|
| `index.ts` | ✅ | Barrel export |
| `CardAttributesStrip.tsx` | ✅ | Card info strip (cost, disciplines, type) |
| `SettingsModal.tsx` | ✅ | Bottom sheet with game settings |
| `Hud.tsx` | ✅ | Top bar with score/streak/settings |
| `CardStage.tsx` | ✅ | Card image with responsive clamp() sizing |
| `GameControls.tsx` | ✅ | Answer grid + skip button |

## Remaining Task: Refactor Main Page

**File to modify:** `src/app/(apps)/vtes-guess/guess-card/page.tsx`

### Step 1: Replace Main Container Structure

**OLD (lines 807-1853):**
```tsx
<div className="min-h-screen ... p-3 sm:p-6 ...">
  {/* Large header with title */}
  {/* Mode toggle */}
  {/* Score/Streak cards */}
  {/* Difficulty selector */}
  {/* Card type selector */}
  {/* Card display */}
  {/* Card info strip */}
  {/* Game controls */}
  {/* Stats footer */}
</div>
```

**NEW:**
```tsx
<div className="h-screen h-[100dvh] flex flex-col bg-[var(--vtes-bg-primary)]">
  <Hud
    score={score}
    streak={streak}
    gameMode={gameMode}
    rankedCardIndex={rankedCardIndex}
    rankedScore={rankedScore}
    rankedStreak={rankedStats.correct}
    onSettingsClick={() => setIsSettingsOpen(true)}
  />
  
  <CardStage
    card={currentCard}
    cardDetails={cardDetails}
    revealed={revealed}
    feedback={feedback}
    cardKey={cardKey}
    getImageUrl={getImageUrl}
  />
  
  <GameControls
    isCrypt={isCrypt}
    cryptOptions={cryptOptions}
    libraryOptions={libraryOptions}
    gameMode={gameMode}
    onCryptChoice={handleCryptChoice}
    onLibraryChoice={handleLibraryChoice}
    onSkip={skipCard}
    revealed={revealed}
    result={result}
    currentCardName={currentCard?.name}
    cardDetailsType={cardDetails?.type}
    onNextCard={nextCard}
    showDetails={showDetails}
    toggleDetails={() => setShowDetails(!showDetails)}
    cardDetails={cardDetails}
    cardCount={currentCard?.count}
  />
  
  <SettingsModal
    isOpen={isSettingsOpen}
    onClose={() => setIsSettingsOpen(false)}
    selectedDifficulty={selectedDifficulty}
    onDifficultyChange={changeDifficulty}
    cardType={cardType}
    onCardTypeChange={setCardType}
    gameMode={gameMode}
    onGameModeChange={handleGameModeChange}
    totalCards={getFilteredCards().length}
  />
</div>
```

### Step 2: Add State for Settings Modal

Add near top of component:
```tsx
const [isSettingsOpen, setIsSettingsOpen] = useState(false);
```

### Step 3: Update Game Mode Handler

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

### Step 4: Remove Old UI Elements

Delete from main page:
- **Header with title** (lines 994-1015)
- **Mode toggle** (lines 1017-1065)
- **Score/Streak display** (lines 1067-1206)
- **Difficulty selector** (lines 1208-1263)
- **Card type selector** (lines 1265-1294)
- **Stats footer** (lines 1796-1838)

### Step 5: Import Components

```tsx
import { Hud, CardStage, GameControls, SettingsModal } from '@/components/vtes/guess';
```

## Testing Checklist

- [ ] HUD shows correct info for Casual mode (Score + Streak + Settings)
- [ ] HUD shows correct info for Ranked mode (Progress + Streak + Score)
- [ ] Settings gear opens modal
- [ ] Modal contains Difficulty, Card Type, Game Mode
- [ ] Card image is responsive (clamp())
- [ ] Card attributes strip visible below card
- [ ] Answer buttons are tappable
- [ ] Skip button is discreet (text link style)
- [ ] No scrolling on iPhone 14 viewport (~844px)
- [ ] No scrolling on small viewport (~600px)

## Quick Reference for Next Agent

1. Read this plan file
2. Read the main page at `src/app/(apps)/vtes-guess/guess-card/page.tsx`
3. Find the main return statement (around line 807)
4. Replace the container and contents with the new structure shown above
5. Add the `isSettingsOpen` state
6. Add the `handleGameModeChange` handler
7. Delete old UI sections
8. Test in browser with mobile viewport (F12 > Ctrl+Shift+M)
