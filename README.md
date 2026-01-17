# 🎲 Game Night Tracker

Track your board game sessions, compete with friends, and see who's the ultimate champion!

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## Features

- 📝 **Quick Session Logging** - Log games in seconds with BGG integration
- 👥 **Group Play** - Create groups and invite your gaming crew
- 📊 **Rich Statistics** - Win rates, H-index, head-to-head records
- 🏆 **Leaderboards** - See who's on top

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **External API**: BoardGameGeek XML API2
- **Deployment**: Vercel

---

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repo (or copy the files)
cd board-game-tracker

# Install dependencies
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (remember your database password!)
3. Wait for the project to be ready (~2 minutes)

#### Get your API keys:
- Go to **Settings** → **API**
- Copy the **Project URL** and **anon public** key

#### Set up the database:
- Go to **SQL Editor** → **New Query**
- Paste the contents of `supabase-schema.sql`
- Click **Run**

#### Enable Google Auth (optional):
- Go to **Authentication** → **Providers**
- Enable **Google**
- Add your Google OAuth credentials

### 3. Configure Environment Variables

```bash
# Copy the example file
cp .env.local.example .env.local

# Edit with your values
nano .env.local  # or use your preferred editor
```

Add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📁 Project Structure

```
board-game-tracker/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Auth pages (login, register)
│   │   ├── dashboard/         # Main dashboard
│   │   ├── games/             # Game library
│   │   ├── sessions/          # Session history & logging
│   │   ├── players/           # Player/group management
│   │   └── stats/             # Statistics & leaderboards
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── features/          # Feature-specific components
│   │   └── layout/            # Layout components (Sidebar, etc)
│   ├── lib/
│   │   ├── supabase/          # Supabase client & auth
│   │   ├── bgg/               # BoardGameGeek API client
│   │   └── utils/             # Helper functions
│   └── types/                 # TypeScript types
├── public/                    # Static assets
├── supabase-schema.sql        # Database schema
└── package.json
```

---

## 🗄️ Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (extends Supabase auth) |
| `groups` | Gaming groups |
| `group_members` | Users in groups |
| `games` | Cached BGG game info |
| `sessions` | Game play sessions |
| `session_players` | Players & scores per session |

### Row Level Security (RLS)

All tables have RLS policies enabled:
- Users can only see data from their groups
- Users can only modify their own data
- Games table is publicly readable

---

## 🎮 BoardGameGeek Integration

The app uses the [BGG XML API2](https://boardgamegeek.com/wiki/page/BGG_XML_API2) to:

- Search for games by name
- Fetch game details (image, player count, play time, rating)
- Rate-limited to respect BGG's servers

---

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

### Custom Domain

In Vercel dashboard:
- Go to **Settings** → **Domains**
- Add your custom domain
- Update Supabase redirect URLs if using OAuth

---

## 📝 Next Steps (TODO)

### Phase 2 - Core Features
- [ ] Game search component with BGG integration
- [ ] New session form
- [ ] Session history list
- [ ] Player management
- [ ] Group invite system

### Phase 3 - Stats
- [ ] Player statistics page
- [ ] Game statistics
- [ ] H-index calculation
- [ ] Head-to-head comparison

### Phase 4 - Polish
- [ ] PWA support
- [ ] Share session results
- [ ] Dark/light theme toggle
- [ ] Export data

---

## 🤝 Contributing

This is a personal project, but feel free to fork it and make it your own!

---

## 📄 License

MIT - Use it however you want!

---

Made with 🎲 for board game lovers
