# Game Night Tracker - Contexto del Proyecto

## Descripción
App para loguear sesiones de juegos de mesa con amigos. Trackea partidas, estadísticas, y rankings del grupo.

## Stack
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend:** Supabase (auth + PostgreSQL)
- **APIs externas:** BoardGameGeek XML API2

## Estructura Principal
```
src/
├── app/
│   ├── api/bgg/collection/   # API route para fetch de BGG (server-side)
│   ├── dashboard/            # Dashboard principal
│   ├── games/                # Biblioteca de juegos
│   ├── sessions/             # Historial de sesiones
│   ├── players/              # Gestión de grupo
│   ├── stats/                # Estadísticas
│   └── settings/             # Config + importar colección BGG
├── components/ui/            # Componentes reutilizables
├── lib/
│   ├── supabase/             # Cliente Supabase
│   └── bgg/                  # Funciones para BGG API
└── types/                    # TypeScript types
```

## Estado Actual (Enero 2026)

### Completado
- Autenticación (email + Google OAuth)
- Landing page
- UI components (Button, Card, Input, Badge, etc.)
- Sidebar y navegación
- Schema de base de datos en Supabase
- API route `/api/bgg/collection` para importar colección de BGG

### Pendiente - BGG API Token
BGG cambió su API en 2025 y ahora requiere tokens de autorización.

**Estado:** Esperando aprobación de registro en https://boardgamegeek.com/applications

**Cuando llegue el token:**
1. Agregarlo a `.env.local`:
   ```
   BGG_API_TOKEN=el_token_aqui
   ```
2. Probar importar colección en Settings con usuario `patochaos`
3. Actualizar las otras funciones de BGG (`searchGames`, `getGameDetails`, `getHotGames`) para usar el token también

### Próximas Funcionalidades (por implementar)
- [ ] Crear API routes para search y details de BGG (con token)
- [ ] CRUD de sesiones de juego
- [ ] Formulario para registrar partidas
- [ ] Sistema de estadísticas (win rates, H-index)
- [ ] Tabla de líderes del grupo
- [ ] Gestión de jugadores/grupo

## Usuario BGG del Owner
- Username: `patochaos`

## Comandos Útiles
```bash
npm run dev      # Iniciar servidor de desarrollo
npm run build    # Build de producción
npm run lint     # Linter
```

## Variables de Entorno Requeridas
Ver `.env.local.example`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `BGG_API_TOKEN` (pendiente de aprobación)
 
 ## Changelog
 ### 2026-01-16
 - Initial git commit and push to GitHub (Deployment initialization)
 - Deployed to Vercel: https://board-game-tracker-78pn.vercel.app/
