# Deploy Checklists - Salty Meeples & INCONNU

## 🟢 Minor Deploy (hotfixes, copy changes, small UI tweaks)

**Tiempo estimado: 2-5 min**

```bash
# 1. Build check
npm run build

# 2. Quick smoke test
npm run dev
# → Verificar que la página afectada carga sin errores

# 3. Commit y push
git add <files>
git commit -m "fix: descripción corta"
git push
```

**Checklist mental:**
- [ ] Build pasa sin errores
- [ ] La página afectada carga
- [ ] No hay console errors en DevTools
- [ ] Cambio visible funciona como esperado

---

## 🟡 Standard Deploy (nueva feature, refactor moderado)

**Tiempo estimado: 10-15 min**

```bash
# 1. Build + Tests
npm run build
npm run test:run

# 2. Local testing
npm run dev
```

**Checklist:**
- [ ] Build pasa ✓
- [ ] Tests pasan ✓
- [ ] Feature funciona en happy path
- [ ] Feature funciona en edge cases básicos
- [ ] Mobile: verificar en DevTools (toggle device toolbar)
- [ ] No hay console errors/warnings nuevos

**Rutas a verificar según el cambio:**
| Área | Rutas a testear |
|------|-----------------|
| Auth | `/login`, `/register`, logout flow |
| Games | `/bg-tracker/games`, `/bg-tracker/games/[id]` |
| Sessions | `/bg-tracker/sessions`, `/bg-tracker/sessions/new`, `/bg-tracker/sessions/[id]` |
| Stats | `/bg-tracker/stats`, `/bg-tracker/leaderboard` |
| CRUSADE | `/vtes-guess`, `/vtes-guess/guess-card?mode=ranked` |
| Praxis | `/vtes-tracker/sessions/new`, `/vtes-tracker/decks` |

---

## 🔴 Major Deploy (arquitectura, migraciones DB, features críticas)

**Tiempo estimado: 30-60 min**

### Fase 1: Pre-flight checks
```bash
# Build y tests
npm run build
npm run test:run

# Code review automático
# Usar: /everything-claude-code:code-reviewer

# Security review (si hay auth/input/API changes)
# Usar: /everything-claude-code:security-review

# Database review (si hay schema changes)
# Usar: /everything-claude-code:database-reviewer
```

### Fase 2: Testing local exhaustivo

**Auth flows:**
- [ ] Login con email
- [ ] Login con Google OAuth
- [ ] Logout
- [ ] Sesión persiste después de refresh
- [ ] Redirect correcto después de login

**CRUD completo (Salty Meeples):**
- [ ] Crear sesión con múltiples jugadores
- [ ] Editar sesión existente
- [ ] Eliminar sesión
- [ ] Agregar juego desde BGG
- [ ] Importar colección BGG

**CRUD completo (INCONNU):**
- [ ] Crear sesión VTES con 4+ jugadores
- [ ] VP calculation correcto (winner = max VP)
- [ ] Deck linking funciona
- [ ] CRUSADE ranked: jugar partida completa
- [ ] Leaderboard se actualiza

**Edge cases:**
- [ ] Usuario sin grupo
- [ ] Usuario sin sesiones
- [ ] Sesión sin ganador
- [ ] Juego sin imagen
- [ ] Input vacío / caracteres especiales
- [ ] Timeout de red (throttle en DevTools)

**Responsiveness:**
- [ ] iPhone SE (375px)
- [ ] iPhone 14 (390px)
- [ ] iPad (768px)
- [ ] Desktop (1280px+)

### Fase 3: Staging deploy (opcional)

Si Vercel tiene preview deployments:
```bash
git checkout -b feature/my-feature
git push -u origin feature/my-feature
# → Vercel genera preview URL automáticamente
# → Testear en preview antes de merge a main
```

### Fase 4: Production deploy

```bash
# Merge a main (si usaste branch)
git checkout main
git merge feature/my-feature
git push

# O directo a main
git add .
git commit -m "feat: descripción"
git push
```

### Fase 5: Post-deploy verification

- [ ] Abrir producción en incognito
- [ ] Login funciona
- [ ] Feature nueva funciona
- [ ] Verificar logs en Vercel dashboard (si hay errores)

---

## 🗄️ Database Migration Checklist

**ANTES de deploy:**
- [ ] Migration SQL testeada en Supabase SQL Editor
- [ ] Backup de datos críticos (si aplica)
- [ ] RLS policies actualizadas
- [ ] Indexes creados para queries frecuentes

**DESPUÉS de deploy:**
- [ ] Verificar que queries funcionan
- [ ] Verificar que RLS no bloquea acceso legítimo
- [ ] Verificar que datos existentes siguen accesibles

---

## 🚨 Rollback Plan

Si algo falla en producción:

```bash
# Opción 1: Revert commit
git revert HEAD
git push

# Opción 2: Deploy commit anterior
git checkout <commit-hash-anterior>
git push -f origin main  # ⚠️ CUIDADO: force push

# Opción 3: Vercel dashboard
# → Deployments → Click en deploy anterior → "..." → Promote to Production
```

---

## 📋 Template para PR Description

```markdown
## Summary
- [1-3 bullets describiendo el cambio]

## Type of change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Database migration

## Testing done
- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] Mobile tested
- [ ] Edge cases covered

## Checklist
- [ ] Build passes
- [ ] No console errors
- [ ] Responsive design verified
- [ ] Security considerations reviewed (if applicable)
```

---

## Quick Reference: Skills para Review

| Situación | Skill |
|-----------|-------|
| Review general | `/everything-claude-code:code-reviewer` |
| Auth/API/Input | `/everything-claude-code:security-review` |
| SQL/Migrations | `/everything-claude-code:database-reviewer` |
| E2E tests | `/everything-claude-code:e2e` |
| Build errors | `/everything-claude-code:build-error-resolver` |
| Dead code | `/everything-claude-code:refactor-cleaner` |
