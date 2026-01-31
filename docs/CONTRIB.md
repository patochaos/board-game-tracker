# Contributing to Salty Meeples

## Development Workflow

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase account (for database)
- BGG API token (for BoardGameGeek integration)

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/board-game-tracker.git
   cd board-game-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (see [Environment Setup](#environment-setup))

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start Next.js development server with hot reload |
| `build` | `npm run build` | Create production build |
| `start` | `npm run start` | Start production server |
| `lint` | `npm run lint` | Run ESLint to check code quality |
| `test` | `npm run test` | Run Vitest in watch mode |
| `test:run` | `npm run test:run` | Run Vitest once (CI mode) |
| `test:coverage` | `npm run test:coverage` | Run tests with coverage report |

### E2E Tests

End-to-end tests use Playwright:
```bash
npx playwright test          # Run all E2E tests
npx playwright test --ui     # Run with UI mode
npx playwright show-report   # View test report
```

## Environment Setup

Create a `.env.local` file in the project root with these variables:

### Required Variables

| Variable | Description | How to Get |
|----------|-------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | [Supabase Dashboard](https://supabase.com) → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Same location as URL |
| `BGG_API_TOKEN` | BoardGameGeek API token | [BGG Applications](https://boardgamegeek.com/applications) → Register app → Generate token |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | For server-side operations requiring elevated permissions |

### Example `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
BGG_API_TOKEN=your-bgg-token
```

## Testing Procedures

### Unit Tests

Unit tests are located alongside source files or in `__tests__` directories. Run with:
```bash
npm run test        # Watch mode (development)
npm run test:run    # Single run (CI)
```

Coverage target: **80%+**

### Integration Tests

Integration tests verify API routes and database operations. Ensure Supabase is configured before running.

### E2E Tests

E2E tests in `e2e/` directory test full user flows:
```bash
npx playwright test
```

### Pre-commit Checklist

Before submitting a PR:
1. [ ] `npm run lint` passes
2. [ ] `npm run build` succeeds
3. [ ] `npm run test:run` passes
4. [ ] Manual testing completed on `localhost:3000`

## Code Style

- TypeScript strict mode enabled
- ESLint with Next.js recommended rules
- Tailwind CSS for styling
- Proper types (no `any` unless absolutely necessary)
- Named constants for magic numbers

## Project Structure

```
src/
├── app/           # Next.js App Router pages and API routes
├── components/    # Reusable React components
├── hooks/         # Custom React hooks
├── lib/           # Utility functions and API clients
└── types/         # TypeScript type definitions
```

## Getting Help

- Check existing issues on GitHub
- Review CLAUDE.md for project context
- Ask in the project discussions
