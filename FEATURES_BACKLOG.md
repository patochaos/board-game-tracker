# Feature Backlog & Roadmap

Based on research from "BG Stats" and tailored for a private group (~10 players).

## ✅ Core Rules & Use Cases
- **Session Ownership:** Only the user who created a session can **Edit** or **Delete** it.
    - *Status:* Implemented (Enforced via RLS Policies & UI).
- **Group Privacy:** Only members of a group can view its sessions.
    - *Status:* Implemented (RLS).

## 🚀 Phase 1: Engagement (Must Haves)
*Focus: Friendly rivalry and group activity.*

- [x] **Leaderboard Page**
    - **Most Wins:** Who has won the most games total?
    - **Best Win %:** Efficiency metric (requires min. 5 plays).
    - **Most Sessions:** Who shows up the most?
- [x] **"New to Me" / "New to Group" Badges**
    - Highlight when a game is played for the first time.
- [ ] **H-Index**
    - The "Nerd Stat": You have an H-index of *N* if you have played *N* games at least *N* times.

## 🔮 Phase 2: Depth (Nice to Have)
*Focus: Detailed insights and collection analytics.*

- [ ] **Cost per Play Calculator**
    - Requires adding `price_paid` to `games` table.
    - Metric: `Price / Total Plays`.
- [ ] **Rivalries ("The Nemesis")**
    - "Who do I lose to the most?"
- [ ] **Role/Faction Stats**
    - Track win rates per specific character (e.g., "Root" factions).
- [ ] **Challenges Dashboard**
    - 10x10 Challenge (Play 10 games 10 times).
    - Alphabet Challenge.

## ❌ Phase 3: Extras (Low Priority)
- [ ] Deep Analytics/Graphing (Pie charts).
- [ ] In-app Timer/Stopwatch.
- [ ] Social Sharing images.
