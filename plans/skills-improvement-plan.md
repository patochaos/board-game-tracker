# Project Improvement Plan Using New Skills

This plan outlines how to leverage the newly added skills to improve CRUSADE and Praxis Seizure.

---

## Skills Added

| Skill | Location | Purpose |
|-------|----------|---------|
| **web-asset-generator** | `.agent/skills/web-asset-generator/` | Favicons, PWA icons, OG images |
| **seo-nextjs** | `.agent/skills/seo-nextjs/` | Next.js SEO optimization (27 commands) |
| **marketing-skills** | `.agent/skills/marketing-skills/` | CRO, copywriting, analytics (25 skills) |

---

## Phase 1: Branding & Assets (High Priority)

### 1.1 Generate App Icons & Favicons

**Using: `web-asset-generator`**

Current state: No custom favicon or app icons.

Tasks:
- [ ] Create CRUSADE logo/icon (vampire-themed)
- [ ] Generate favicon set (16x16, 32x32, 96x96, favicon.ico)
- [ ] Generate PWA icons (180x180, 192x192, 512x512)
- [ ] Add to `public/` directory
- [ ] Update `app/layout.tsx` with icon metadata

Command:
```bash
python .agent/skills/web-asset-generator/scripts/generate_favicons.py <logo> public/ all
```

### 1.2 Generate Open Graph Images

**Using: `web-asset-generator`**

Current state: Share button exists but no custom OG images.

Tasks:
- [ ] Create OG image for CRUSADE (1200x630)
- [ ] Create OG image for Praxis Seizure (1200x630)
- [ ] Create Twitter card image (1200x675)
- [ ] Update metadata in layouts

Command:
```bash
python .agent/skills/web-asset-generator/scripts/generate_og_images.py public/ \
  --text "CRUSADE - Test Your VTES Knowledge" \
  --bg-color "#1a1a2e"
```

---

## Phase 2: SEO Optimization (High Priority)

### 2.1 SEO Audit

**Using: `seo-nextjs`**

Tasks:
- [ ] Run full SEO audit: `/seo-audit`
- [ ] Check metadata completeness: `/metadata`
- [ ] Verify structured data: `/structured-data`
- [ ] Generate robots.txt: `/robots-txt`
- [ ] Create sitemap

### 2.2 Metadata Optimization

**Using: `seo-nextjs/skills/metadata-optimizer`**

Current issues:
- Missing dynamic OG tags per page
- No Twitter card metadata
- Generic descriptions

Tasks:
- [ ] Add page-specific metadata to all routes
- [ ] Implement dynamic OG images for game pages
- [ ] Add JSON-LD structured data for:
  - WebApplication schema (for CRUSADE)
  - SoftwareApplication schema (for Praxis Seizure)
  - Leaderboard/ItemList schema

### 2.3 Content Optimization

**Using: `seo-nextjs/skills/content-optimizer`**

Tasks:
- [ ] Optimize landing page copy
- [ ] Add alt text to all images
- [ ] Improve heading hierarchy (H1-H6)
- [ ] Internal linking strategy

---

## Phase 3: Conversion Optimization (Medium Priority)

### 3.1 Landing Page CRO

**Using: `marketing-skills/skills/page-cro`**

Current landing page analysis needed:
- [ ] Audit current conversion funnel
- [ ] Improve CTAs (Practice vs Ranked)
- [ ] Add social proof (leaderboard highlights)
- [ ] Optimize above-the-fold content

### 3.2 Signup Flow CRO

**Using: `marketing-skills/skills/signup-flow-cro`**

Tasks:
- [ ] Analyze registration flow
- [ ] Reduce friction in signup
- [ ] Add progress indicators
- [ ] Improve error messages

### 3.3 Onboarding CRO

**Using: `marketing-skills/skills/onboarding-cro`**

Tasks:
- [ ] Create first-run experience for CRUSADE
- [ ] Add tutorial/tips for new players
- [ ] Improve time-to-value

---

## Phase 4: Content & Copy (Medium Priority)

### 4.1 Copywriting Improvements

**Using: `marketing-skills/skills/copywriting`**

Tasks:
- [ ] Rewrite landing page headlines
- [ ] Improve feature descriptions
- [ ] Add compelling microcopy
- [ ] Review and polish all UI text

### 4.2 Social Content

**Using: `marketing-skills/skills/social-content`**

Tasks:
- [ ] Create shareable result cards
- [ ] Design social-optimized score images
- [ ] Add social sharing metadata

---

## Phase 5: Analytics & Testing (Lower Priority)

### 5.1 Analytics Setup

**Using: `marketing-skills/skills/analytics-tracking`**

Tasks:
- [ ] Set up event tracking for:
  - Game starts (mode selection)
  - Game completions
  - Score submissions
  - Share button clicks
- [ ] Create conversion funnels
- [ ] Track user retention

### 5.2 A/B Testing

**Using: `marketing-skills/skills/ab-test-setup`**

Future experiments:
- [ ] Landing page layout variations
- [ ] CTA button text/colors
- [ ] Game difficulty balancing

---

## Phase 6: Technical SEO (Lower Priority)

### 6.1 Performance

**Using: `seo-nextjs`**

Tasks:
- [ ] Image optimization audit
- [ ] Core Web Vitals improvements
- [ ] Lazy loading strategy

### 6.2 Schema Markup

**Using: `marketing-skills/skills/schema-markup`**

Tasks:
- [ ] Add Game schema for CRUSADE
- [ ] Add Organization schema
- [ ] Add BreadcrumbList for navigation

---

## Implementation Order

### Sprint 1: Assets & Basic SEO
1. Generate favicons and app icons
2. Create OG images for sharing
3. Run SEO audit and fix critical issues
4. Add basic metadata to all pages

### Sprint 2: Conversion & Copy
1. Landing page CRO audit
2. Copywriting improvements
3. Signup flow optimization
4. Social sharing enhancements

### Sprint 3: Analytics & Polish
1. Set up analytics tracking
2. Implement structured data
3. Performance optimizations
4. A/B testing framework

---

## Phase 7: Code Quality & Performance (From Existing Skills)

### 7.1 UI/UX Fixes

**Using: `ui-ux-pro-max`**

Tasks:
- [ ] Replace emojis with Lucide icons on landing page
- [ ] Replace emojis in CRUSADE mode selection
- [ ] Add `cursor-pointer` to all interactive cards
- [ ] Audit touch targets (44x44px minimum)
- [ ] Check focus states for accessibility

### 7.2 React Performance

**Using: `react-best-practices`**

Tasks:
- [ ] Add `next/dynamic` for heavy components (guess-card game)
- [ ] Use `React.memo` for card option components
- [ ] Parallelize API calls with `Promise.all()`
- [ ] Audit barrel imports for bundle size

### 7.3 Frontend Patterns

**Using: `frontend-dev-guidelines`**

Tasks:
- [ ] Add `React.lazy()` for guess-card component
- [ ] Wrap with proper Suspense boundaries
- [ ] Remove early return loading patterns (causes CLS)

### 7.4 Test Improvements

**Using: `testing-patterns`**

Tasks:
- [ ] Create `getMockCard()` factory function
- [ ] Create `getMockGameState()` factory function
- [ ] Refactor inline test data to use factories

---

## Quick Wins (Can Do Immediately)

1. **Favicon**: Use emoji-based generator for quick favicon
   ```bash
   python .agent/skills/web-asset-generator/scripts/generate_favicons.py --emoji "🧛" public/ all
   ```

2. **SEO Check**: Run quick audit
   ```bash
   /seo-check
   ```

3. **Metadata**: Add basic OG tags to layout.tsx

4. **robots.txt**: Generate and add to public/

5. **Replace emojis**: Swap landing page emojis for Lucide icons

6. **Add cursor-pointer**: Quick CSS fix for interactive cards

7. **Lazy load game**: Wrap guess-card in `next/dynamic`

---

## Resources

- [web-asset-generator docs](.agent/skills/web-asset-generator/SKILL.md)
- [SEO commands reference](.agent/skills/seo-nextjs/commands/)
- [Marketing skills catalog](.agent/skills/marketing-skills/skills/)

---

## Sources

Skills sourced from:
- [awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills)
- [web-asset-generator](https://github.com/alonw0/web-asset-generator)
- [claude-code-seo](https://github.com/huifer/claude-code-seo)
- [marketingskills](https://github.com/coreyhaines31/marketingskills)
