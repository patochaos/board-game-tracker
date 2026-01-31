# Salty Meeples - Operations Runbook

## Deployment Procedures

### Production Deployment (Vercel)

The app is deployed on Vercel with automatic deployments from the `main` branch.

#### Pre-deployment Checklist
1. [ ] `npm run build` succeeds locally
2. [ ] `npm run test:run` passes
3. [ ] `npm run lint` passes
4. [ ] Manual testing on `localhost:3000` completed
5. [ ] User approval obtained for new features

#### Deployment Steps

1. **Merge to main**: Push or merge your changes to the `main` branch
2. **Automatic deploy**: Vercel detects the push and starts building
3. **Verify**: Check Vercel dashboard for build status
4. **Test production**: Verify the feature works on production URL

#### Environment Variables on Vercel

Configure in Vercel Dashboard → Settings → Environment Variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `BGG_API_TOKEN` | Yes | BoardGameGeek API token |
| `SUPABASE_SERVICE_ROLE_KEY` | No | For elevated server operations |

### Manual Deployment

```bash
# Build locally
npm run build

# Deploy to Vercel manually
vercel --prod
```

## Monitoring and Alerts

### Health Checks

- **Vercel Dashboard**: View deployment status, build logs, and analytics
- **Supabase Dashboard**: Monitor database usage, API calls, and auth metrics

### Key Metrics to Monitor

| Metric | Where to Check | Threshold |
|--------|----------------|-----------|
| Build status | Vercel Dashboard | Should be "Ready" |
| API response times | Vercel Analytics | < 2s |
| Database connections | Supabase Dashboard | < 50 concurrent |
| Auth errors | Supabase Auth logs | < 1% error rate |

### Logs

- **Application logs**: Vercel → Deployments → Functions tab
- **Database logs**: Supabase → Database → Logs
- **Auth logs**: Supabase → Authentication → Logs

## Common Issues and Fixes

### BGG API Returns 401 Unauthorized

**Symptoms**: BGG search/import features fail with 401 error

**Cause**: Missing or invalid `BGG_API_TOKEN`

**Fix**:
1. Verify token is set in Vercel environment variables
2. Check token hasn't expired at [BGG Applications](https://boardgamegeek.com/applications)
3. Regenerate token if needed and update in Vercel

### BGG API Returns 202 Queued

**Symptoms**: Collection imports hang or timeout

**Cause**: BGG queues large collection requests

**Fix**: This is normal behavior. The app already implements retry logic with:
- 2 second delay between retries
- Maximum 5 retry attempts

### Supabase Auth Session Expired

**Symptoms**: Users logged out unexpectedly, auth errors

**Fix**:
1. Check Supabase Auth settings for session duration
2. Verify `@supabase/ssr` is handling token refresh correctly
3. Clear browser cookies and re-login

### Build Failures

**Common causes**:
1. **TypeScript errors**: Run `npm run build` locally to see errors
2. **Missing env vars**: Check all required variables are set in Vercel
3. **Dependency issues**: Delete `node_modules` and `npm install`

### Database Connection Issues

**Symptoms**: Queries fail or timeout

**Fix**:
1. Check Supabase project status in dashboard
2. Verify connection limits aren't exceeded
3. Check RLS policies if queries return empty unexpectedly

## Rollback Procedures

### Vercel Rollback

1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click the three dots menu → "Promote to Production"

### Database Rollback

**Warning**: Database rollbacks require careful handling.

1. **Recent data loss acceptable**: Restore from Supabase daily backups
   - Supabase Dashboard → Database → Backups

2. **Preserve data**: Create a migration to reverse changes
   - Write SQL to undo schema changes
   - Apply via Supabase SQL editor

### Emergency Contacts

- Vercel Status: https://vercel-status.com
- Supabase Status: https://status.supabase.com

## Scheduled Maintenance

### Regular Tasks

| Task | Frequency | Description |
|------|-----------|-------------|
| Dependency updates | Monthly | Run `npm outdated` and update |
| Security audit | Monthly | Run `npm audit` |
| Database vacuum | Automatic | Handled by Supabase |
| Log review | Weekly | Check for recurring errors |

### Dependency Updates

```bash
# Check outdated packages
npm outdated

# Update non-breaking changes
npm update

# Update major versions (review changelogs first)
npm install package@latest
```
