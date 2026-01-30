# Pre-Build Checklist

Always run these steps before `npm run build`:

## Required Steps

1. **Kill all Node processes**
   ```bash
   pkill -f node
   # or on Windows:
   taskkill /F /IM node.exe
   ```

2. **Delete .next cache folder**
   ```bash
   rm -rf .next
   ```

3. **Close VS Code terminals** running dev servers or watch commands

4. **Close browser tabs** on localhost (prevents HMR reconnection attempts)

## Windows-Specific

- Add project folder to **Windows Defender exclusions** (Settings > Virus & threat protection > Manage settings > Exclusions)
- Close any **File Explorer windows** open to the project folder

## If Build Still Hangs

1. Check where it stops:
   - Linting? → Check for eslint issues
   - Type checking? → Run `npx tsc --noEmit` separately
   - Static generation? → Check for `generateStaticParams` generating too many pages

2. Try verbose output:
   ```bash
   npm run build -- --debug
   ```

3. Check for infinite loops in data fetching during SSR

## Quick One-Liner (Unix/Git Bash)

```bash
pkill -f node; rm -rf .next; npm run build
```
