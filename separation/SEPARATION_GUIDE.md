# Guía de Separación: INCONNU + Board Game Tracker

## Resumen
Vamos a separar el proyecto en dos apps independientes:
1. **INCONNU** (CRUSADE + PRAXIS) → Nuevo Supabase + Nuevo Vercel
2. **Board Game Tracker** → Supabase actual + Vercel actual

---

## PASO 1: Crear Nuevo Proyecto en Supabase

1. Ir a [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Configurar:
   - **Name**: `inconnu`
   - **Database Password**: (generar uno seguro, guardarlo)
   - **Region**: Mismo que el actual (para latencia similar)
4. Esperar ~2 minutos a que se cree

5. Ir a **Settings → API** y copiar:
   - `Project URL` → será `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## PASO 2: Configurar Auth en Nuevo Supabase

1. Ir a **Authentication → Providers**
2. Habilitar **Email** (ya debería estar)
3. Habilitar **Google**:
   - Ir a [Google Cloud Console](https://console.cloud.google.com/)
   - Crear nuevo OAuth Client (o agregar URL al existente)
   - Authorized redirect URI: `https://[TU-PROYECTO].supabase.co/auth/v1/callback`
   - Copiar Client ID y Secret a Supabase

---

## PASO 3: Crear Schema en Nuevo Supabase

1. Ir a **SQL Editor** en el nuevo proyecto
2. Copiar TODO el contenido de `separation/01_inconnu_schema.sql`
3. Click "Run"
4. Verificar que no hay errores

---

## PASO 4: Migrar Datos (Opcional)

Si tenés datos de VTES que querés mantener:

1. En el **Supabase ACTUAL**, ir a SQL Editor
2. Ejecutar cada query de `separation/02_export_vtes_data.sql` por separado
3. Copiar los INSERT statements generados
4. En el **Supabase NUEVO**, pegar y ejecutar los INSERT statements

**Nota**: Los usuarios deberán re-registrarse porque la auth es por proyecto.

---

## PASO 5: Crear Nuevo Repositorio

```bash
# Opción A: Copiar el repo actual
cd ~/projects
cp -r board-game-tracker inconnu
cd inconnu

# Limpiar git history (nuevo proyecto)
rm -rf .git
git init
git add .
git commit -m "Initial commit: CRUSADE/Praxis"

# Crear repo en GitHub
gh repo create inconnu --private --push
```

---

## PASO 6: Limpiar Código CRUSADE (Nuevo Repo)

En el nuevo repo `inconnu`, eliminar:

```bash
# Eliminar código de Board Game Tracker
rm -rf src/app/(apps)/bg-tracker
rm -rf src/app/api/bgg

# Mantener solo VTES
# src/app/(apps)/vtes-guess ✓
# src/app/(apps)/vtes-tracker ✓
```

Modificar archivos:
1. **`src/app/page.tsx`** - Landing de CRUSADE solamente
2. **`src/middleware.ts`** - Quitar rutas de BG
3. **`package.json`** - Cambiar nombre a "inconnu"

---

## PASO 7: Actualizar Variables de Entorno

Crear `.env.local` en el nuevo repo:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[NUEVO-PROYECTO].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[NUEVA-KEY]
```

---

## PASO 8: Deploy a Vercel (Nuevo Proyecto)

1. Ir a [vercel.com/new](https://vercel.com/new)
2. Importar el repo `inconnu`
3. Configurar Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

5. Configurar dominio custom (opcional):
   - `crusade.tudominio.com` o similar

---

## PASO 9: Limpiar Board Game Tracker (Repo Original)

En el repo original, eliminar código VTES:

```bash
# Eliminar código de VTES
rm -rf src/app/(apps)/vtes-guess
rm -rf src/app/(apps)/vtes-tracker
rm -rf src/hooks/useVtes*
```

Modificar archivos:
1. **`src/app/page.tsx`** - Landing de Board Game Tracker solamente
2. **`src/middleware.ts`** - Quitar rutas de VTES
3. **Eliminar** tablas VTES del Supabase actual (después de confirmar que todo funciona)

---

## PASO 10: Verificación Final

### Checklist CRUSADE (nuevo):
- [ ] Login/Register funciona
- [ ] Google OAuth funciona
- [ ] CRUSADE game carga cartas
- [ ] Leaderboard funciona
- [ ] Praxis (sessions) funciona
- [ ] Decks CRUD funciona

### Checklist Board Game Tracker (original):
- [ ] Login/Register funciona
- [ ] Dashboard carga
- [ ] Sessions CRUD funciona
- [ ] Games desde BGG funciona
- [ ] Stats funcionan

---

## Dominios Sugeridos

- **CRUSADE**: `crusade.app` o `inconnu.vercel.app`
- **Board Game Tracker**: `gamenight.app` o tu dominio actual

---

## Troubleshooting

### "Auth error" al registrar
- Verificar que Google OAuth tiene la URL correcta del nuevo proyecto

### "RLS policy error"
- Verificar que ejecutaste todo el schema SQL
- Verificar que el usuario está autenticado

### Datos no aparecen
- Verificar que importaste los datos correctamente
- Los usuarios necesitan re-registrarse (auth es por proyecto)

---

## Próximos Pasos Post-Separación

1. Configurar dominios custom
2. Agregar analytics por separado
3. Configurar Supabase Pro cuando sea necesario
4. Considerar CDN para imágenes de cartas
