---
description: Safe deployment to production
---

# Deploy Protocol

Before pushing changes to the repository, you MUST follow these steps to ensure stability.

1. **Verify Build**: Run the build command to catch type errors and compilation issues.
   ```bash
   npm run build
   ```
   *If this fails, DO NOT DEPLOY. Fix the errors first.*

2. **Commit Changes**: Use a descriptive commit message.
   ```bash
   git add .
   git commit -m "your message"
   ```

3. **Push to Remote**:
   ```bash
   git push
   ```

// turbo
4. **Notify User**: Inform the user that the deployment has been pushed after verification.
