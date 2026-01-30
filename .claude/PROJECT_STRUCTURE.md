# Project Structure Reference

This document describes the naming convention for the 3 apps in this project and their sections.

---

## Apps Overview

| App Code | Full Name | Route | Description |
|----------|-----------|-------|-------------|
| **BGT** | Board Game Tracker | `/bg-tracker/` | Track board game sessions, collection, and stats |
| **CRUSADE** | CRUSADE | `/vtes-guess/` | VTES card guessing game (5000+ cards) |
| **PRAXIS** | Praxis Seizure | `/vtes-tracker/` | VTES deck management and session tracking |

---

## BGT - Board Game Tracker

**Base route:** `/bg-tracker/`

| Section | Route | Description |
|---------|-------|-------------|
| `bgt/dashboard` | `/bg-tracker/dashboard` | Main dashboard with quick stats |
| `bgt/games` | `/bg-tracker/games` | Game library with BGG integration |
| `bgt/games/detail` | `/bg-tracker/games/[id]` | Single game details + expansions |
| `bgt/sessions` | `/bg-tracker/sessions` | Session history list |
| `bgt/sessions/new` | `/bg-tracker/sessions/new` | New session form |
| `bgt/sessions/detail` | `/bg-tracker/sessions/[id]` | Single session details |
| `bgt/leaderboard` | `/bg-tracker/leaderboard` | Player rankings |
| `bgt/stats` | `/bg-tracker/stats` | Statistics and achievements |
| `bgt/stats/h2h` | `/bg-tracker/stats/head-to-head` | Head-to-head comparison |
| `bgt/group` | `/bg-tracker/players` | Group management |
| `bgt/collection/import` | `/bg-tracker/collection/import` | BGG collection import |

---

## CRUSADE - VTES Card Guessing Game

**Base route:** `/vtes-guess/`

| Section | Route | Description |
|---------|-------|-------------|
| `crusade/landing` | `/vtes-guess` | Mode selection (Practice vs Ranked) |
| `crusade/game` | `/vtes-guess/guess-card` | Main game interface |
| `crusade/leaderboard` | `/vtes-guess/leaderboard/guess` | Global rankings |

**Internal/Debug pages (not user-facing):**
- `/vtes-guess/test-image` - Image testing
- `/vtes-guess/crop-test` - Crop testing
- `/vtes-guess/mask-debug` - Mask debugging
- `/vtes-guess/gender-tagger` - Gender tagging tool

---

## PRAXIS - Praxis Seizure (VTES Tracker)

**Base route:** `/vtes-tracker/`

| Section | Route | Description |
|---------|-------|-------------|
| `praxis/home` | `/vtes-tracker` | VTES dashboard with player stats |
| `praxis/decks` | `/vtes-tracker/decks` | Deck list |
| `praxis/decks/detail` | `/vtes-tracker/decks/[id]` | Single deck view |
| `praxis/decks/import` | `/vtes-tracker/decks/import` | Import deck from VDB |
| `praxis/cards` | `/vtes-tracker/cards` | Card search/browser |
| `praxis/sessions` | `/vtes-tracker/sessions` | VTES session history |
| `praxis/sessions/new` | `/vtes-tracker/sessions/new` | Log new VTES session |
| `praxis/sessions/detail` | `/vtes-tracker/sessions/[id]` | Single session details |
| `praxis/players/detail` | `/vtes-tracker/players/[id]` | Player profile |

---

## Shared Pages (Root level)

| Route | Description |
|-------|-------------|
| `/` | Landing page (app selector) |
| `/login` | Login page |
| `/register` | Registration page |
| `/join` | Group join via invite link |
| `/onboard` | New user onboarding |
| `/settings` | User settings |

---

## Usage Examples

When communicating about sections:

- "Fix a bug in `crusade/game`" = the main guessing game interface
- "Update `bgt/leaderboard`" = the Board Game Tracker rankings page
- "Change something in `praxis/decks`" = the VTES deck list page

This naming convention helps quickly identify which app and section we're working on.
