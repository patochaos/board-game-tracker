# UI/UX Improvements - Board Game Tracker (VTES Module)

## Project Context
- **Stack**: Next.js 14 (App Router), React, Tailwind CSS, Framer Motion, Supabase
- **Game location**: `/src/app/vtes/guess-card/`
- **Goal**: Improve user experience for the "Guess the Card" game and other VTES sections

---

## 🔴 HIGH PRIORITY

### Task 1: Visual Feedback on Correct/Incorrect Answers in Guess the Card

**File to modify**: `src/app/vtes/guess-card/page.tsx` (or the game component)

**Detailed requirements**:

1. **When user answers CORRECTLY**:
   - Show a semi-transparent green flash/overlay that appears and fades (300ms)
   - The card should do a "pulse" or "bounce" animation
   - Display text "Correct!" with the card name
   - The Score counter should animate (brief scale up)
   - The Streak counter should animate if it increments
   - Use Framer Motion for all animations

2. **When user answers INCORRECTLY**:
   - Show a semi-transparent red flash/overlay (300ms)
   - The card should do a horizontal "shake" animation
   - Display the correct card name: "It was: [card name]"
   - The streak should reset with a "fade out" animation of the previous number

3. **Special Streak animations**:
   - When reaching streak of 5: show "🔥 On Fire!"
   - When reaching streak of 10: show "⚡ Unstoppable!"
   - When reaching streak of 20: show "👑 VTES Master!"
   - These notifications should appear as animated toast/badge at the top of the screen

**Implementation example with Framer Motion**:
```tsx
import { motion, AnimatePresence } from 'framer-motion';

// State for feedback
const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

// Animation variants
const shakeVariants = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
  }
};

const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: { duration: 0.3 }
  }
};

// In JSX, wrap the card image:
<motion.div
  animate={feedback === 'incorrect' ? 'shake' : feedback === 'correct' ? 'pulse' : undefined}
  variants={{ ...shakeVariants, ...pulseVariants }}
>
  {/* Card image here */}
</motion.div>

// Feedback overlay
<AnimatePresence>
  {feedback && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`absolute inset-0 ${feedback === 'correct' ? 'bg-green-500/20' : 'bg-red-500/20'} rounded-lg`}
    />
  )}
</AnimatePresence>
```

---

### Task 2: Card Transition Animation

**File to modify**: Same game component

**Requirements**:

1. When loading a new card:
   - The previous card should "fade out" + "slide left"
   - The new card should "fade in" + "slide from right"
   - Total duration: ~400ms

2. The transition should be smooth and not feel "choppy"

**Suggested implementation**:
```tsx
const [currentCard, setCurrentCard] = useState(null);
const [key, setKey] = useState(0); // To force AnimatePresence re-render

// When card changes
const loadNextCard = () => {
  setKey(prev => prev + 1);
  // ... logic to load new card
};

// In JSX:
<AnimatePresence mode="wait">
  <motion.div
    key={key}
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -50 }}
    transition={{ duration: 0.3 }}
  >
    <Image src={cardImage} ... />
  </motion.div>
</AnimatePresence>
```

---

### Task 3: Improve Button Visual Hierarchy

**File to modify**: Game component

**Requirements**:

1. **"Submit Answer" button**:
   - Should be the primary button
   - Prominent color (e.g.: purple-600 or the app's main color)
   - Larger than other buttons
   - Hover state with scale and color change
   - Add check or arrow icon

2. **"Skip" button**:
   - Secondary/outline style
   - Smaller or equal but less prominent
   - Neutral color (gray)

3. **"Show Initials" button**:
   - Tertiary/ghost style
   - With lightbulb icon (replace 💡 with SVG)

**Suggested code**:
```tsx
// Submit - Primary
<button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
  <CheckIcon className="w-5 h-5" />
  Submit Answer
</button>

// Skip - Secondary
<button className="w-full border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-all hover:bg-gray-50">
  Skip
</button>

// Hint - Tertiary
<button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors">
  <LightBulbIcon className="w-4 h-4" />
  Show Initials (-25 pts)
</button>
```

---

## 🟡 MEDIUM PRIORITY

### Task 4: Autocomplete for Game Input

**Files to modify**:
- Game component
- Possibly create a new component `CardAutocomplete.tsx`

**Requirements**:

1. As the user types, show card name suggestions
2. Suggestions should use fuzzy matching (already enabled according to UI)
3. Maximum 5-6 visible suggestions
4. Navigate with up/down arrow keys
5. Enter or click selects the suggestion
6. Suggestions should appear in a dropdown below the input
7. Show card type (Library/Crypt) next to the name in suggestions

**Considerations**:
- Don't reveal the correct card if suggestions are too few
- Maybe filter to not show the exact card if only 1-2 options remain
- Filtering should be client-side for speed

**Component structure**:
```tsx
interface CardSuggestion {
  name: string;
  type: 'library' | 'crypt';
}

const CardAutocomplete = ({
  value,
  onChange,
  onSelect,
  cards // list of all cards to filter
}: Props) => {
  const [suggestions, setSuggestions] = useState<CardSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter cards based on input
  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    const filtered = cards
      .filter(card =>
        card.name.toLowerCase().includes(value.toLowerCase())
      )
      .slice(0, 6);

    setSuggestions(filtered);
  }, [value, cards]);

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && suggestions[selectedIndex]) {
      onSelect(suggestions[selectedIndex].name);
    }
  };

  return (
    <div className="relative">
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full ..."
      />
      {suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.name}
              onClick={() => onSelect(suggestion.name)}
              className={`px-3 py-2 cursor-pointer flex justify-between ${
                index === selectedIndex ? 'bg-purple-50' : 'hover:bg-gray-50'
              }`}
            >
              <span>{suggestion.name}</span>
              <span className="text-xs text-gray-400">{suggestion.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

### Task 5: Auto-focus and Input UX

**File to modify**: Game component

**Requirements**:

1. After each answer (correct or incorrect), the input should:
   - Clear automatically
   - Receive focus automatically after ~500ms (to give time to see feedback)

2. User should be able to press Enter to submit the answer

3. Input should have dynamic placeholder: "Type card name..."

**Implementation**:
```tsx
const inputRef = useRef<HTMLInputElement>(null);

const handleSubmit = async () => {
  // ... verification logic

  // After feedback
  setTimeout(() => {
    setAnswer(''); // clear input
    inputRef.current?.focus(); // auto focus
  }, 500);
};

// In the input
<input
  ref={inputRef}
  value={answer}
  onChange={e => setAnswer(e.target.value)}
  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
  placeholder="Type card name..."
  autoFocus
/>
```

---

### Task 6: Active Page Indicator in Navigation

**File to modify**: Navigation component (probably in `src/components/layout/` or similar)

**Requirements**:

1. The menu item corresponding to the current page should be visually highlighted
2. Use a clear indicator: colored background, left border, or different text color
3. Should work with Next.js App Router (use `usePathname`)

**Implementation**:
```tsx
'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { href: '/vtes', label: 'Dashboard' },
  { href: '/vtes/decks', label: 'Decks' },
  { href: '/vtes/sessions', label: 'Sessions' },
  { href: '/vtes/leaderboard', label: 'Leaderboard' },
  { href: '/vtes/cards', label: 'Search Cards' },
  { href: '/vtes/guess-card', label: 'Guess Card' },
];

const Navigation = () => {
  const pathname = usePathname();

  return (
    <nav>
      {navItems.map(item => {
        const isActive = pathname === item.href ||
          (item.href !== '/vtes' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              px-4 py-2 rounded-lg transition-colors
              ${isActive
                ? 'bg-purple-100 text-purple-700 font-medium border-l-4 border-purple-600'
                : 'text-gray-600 hover:bg-gray-100'
              }
            `}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};
```

---

## 🟢 LOW PRIORITY

### Task 7: Improve Landing Page with Visual Hero

**File to modify**: `src/app/page.tsx`

**Requirements**:

1. Add a background with subtle gradient or pattern
2. Add a tagline below the title: "Track. Compete. Dominate."
3. Add SVG icons to each card (dice for Board Games, fangs/vampire for VTES)
4. Improve cards with more noticeable hover effects

**Design suggestions**:
```tsx
// Background with gradient
<main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">

// Tagline
<h1 className="text-4xl font-bold text-white">GAME TRACKER</h1>
<p className="text-purple-300 mt-2">Track. Compete. Dominate.</p>

// Card with better hover
<div className="group bg-white/10 backdrop-blur-sm rounded-xl p-6 transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 cursor-pointer">
  {/* Icon */}
  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
    <DiceIcon className="w-6 h-6 text-white" />
  </div>
  <h2>Board Games</h2>
  ...
</div>
```

---

### Task 8: Group Clans in Card Search Dropdown

**File to modify**: `src/app/vtes/cards/page.tsx`

**Requirements**:

1. Organize clans by sect/group:
   - **Camarilla**: Brujah, Gangrel, Malkavian, Nosferatu, Toreador, Tremere, Ventrue
   - **Sabbat**: Lasombra, Tzimisce, Pander, etc.
   - **Independent**: Assamite, Followers of Set, Giovanni, Ravnos
   - **Laibon**: Akunanse, Guruhi, Ishtarri, Osebo
   - **Bloodlines**: Baali, Blood Brothers, Gargoyles, etc.

2. Use a select with optgroups or a custom dropdown with sections

**Implementation with optgroup**:
```tsx
<select className="...">
  <option value="">Any Clan</option>

  <optgroup label="Camarilla">
    <option value="brujah">Brujah</option>
    <option value="gangrel">Gangrel</option>
    <option value="malkavian">Malkavian</option>
    <option value="nosferatu">Nosferatu</option>
    <option value="toreador">Toreador</option>
    <option value="tremere">Tremere</option>
    <option value="ventrue">Ventrue</option>
  </optgroup>

  <optgroup label="Sabbat">
    <option value="lasombra">Lasombra</option>
    <option value="tzimisce">Tzimisce</option>
    <option value="pander">Pander</option>
  </optgroup>

  <optgroup label="Independent">
    <option value="assamite">Assamite</option>
    <option value="followers-of-set">Followers of Set</option>
    <option value="giovanni">Giovanni</option>
    <option value="ravnos">Ravnos</option>
  </optgroup>

  {/* ... more groups */}
</select>
```

---

### Task 9: Skeleton Loaders for Loading States

**Files to modify**:
- `src/app/vtes/decks/page.tsx`
- Any other component with loading states

**Requirements**:

1. Replace "Loading..." with animated skeleton loaders
2. Skeletons should mimic the shape of the actual content

**Reusable Skeleton component**:
```tsx
// src/components/ui/Skeleton.tsx
const Skeleton = ({ className }: { className?: string }) => (
  <div
    className={`animate-pulse bg-gray-200 rounded ${className}`}
  />
);

// Skeleton for a deck card
const DeckCardSkeleton = () => (
  <div className="border rounded-lg p-4 space-y-3">
    <Skeleton className="h-6 w-3/4" /> {/* Title */}
    <Skeleton className="h-4 w-1/2" /> {/* Author */}
    <div className="flex gap-2">
      <Skeleton className="h-6 w-16" /> {/* Tag */}
      <Skeleton className="h-6 w-16" /> {/* Tag */}
    </div>
  </div>
);

// In the decks page
{isLoading ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => <DeckCardSkeleton key={i} />)}
  </div>
) : (
  // Actual content
)}
```

---

### Task 10: Improved Empty States

**Files to modify**: Pages with empty lists

**Requirements**:

1. When there's no content, display:
   - Illustration or icon
   - Descriptive message
   - CTA (Call to Action) for the next action

**Example for Decks**:
```tsx
const EmptyDecks = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <FolderIcon className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-1">No decks yet</h3>
    <p className="text-gray-500 mb-4">Import your first deck to get started</p>
    <Link
      href="/vtes/decks/import"
      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
    >
      Import Deck
    </Link>
  </div>
);
```

---

## Summary of Files to Modify

| File | Tasks |
|------|-------|
| `src/app/vtes/guess-card/page.tsx` | 1, 2, 3, 4, 5 |
| `src/components/layout/Navigation.tsx` (or similar) | 6 |
| `src/app/page.tsx` | 7 |
| `src/app/vtes/cards/page.tsx` | 8 |
| `src/app/vtes/decks/page.tsx` | 9, 10 |
| `src/components/ui/Skeleton.tsx` (new) | 9 |
| `src/components/ui/CardAutocomplete.tsx` (new) | 4 |

---

## Dependencies That May Be Needed

```bash
# If Framer Motion is not installed (should already be there)
npm install framer-motion

# For SVG icons (if not using a library)
npm install @heroicons/react
# or
npm install lucide-react
```

---

## Suggested Implementation Order

1. **Task 3** - Button hierarchy (quick, high visual impact)
2. **Task 1** - Visual feedback correct/error (critical for game UX)
3. **Task 2** - Card transition animation
4. **Task 5** - Auto-focus and Enter to submit
5. **Task 6** - Active page indicator
6. **Task 4** - Autocomplete (more complex)
7. **Tasks 7-10** - Minor improvements

---

## Additional Notes

- The project already uses Framer Motion, so animations should integrate easily
- Keep consistency with existing colors (seems to use purple as main color)
- Test on mobile since it's important for casual game usage
- Consider adding `prefers-reduced-motion` media query for users who prefer less animations
