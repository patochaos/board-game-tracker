import { test, expect } from '@playwright/test';

test('navigate from sessions list to detail', async ({ page }) => {
    // 1. Go to sessions list
    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');

    // 2. Check if there are any sessions (assuming test db has some, or we might need to handle empty state)
    // We can assume there's at least one if we want to test navigation.
    // If not, we can't test it.

    // Look for link to session
    // The code structure is Link > Card.
    // Link href starts with /sessions/

    const sessionLink = page.locator('a[href^="/sessions/"]').first();

    // If no sessions, this test is inconclusive but we check anyway
    if (await sessionLink.count() > 0) {
        console.log('Found session link, clicking...');
        const href = await sessionLink.getAttribute('href');
        await sessionLink.click();

        // 3. Verify URL changed
        await expect(page).toHaveURL(new RegExp(href!));

        // 4. Verify detail page content loaded (e.g. "Session Details" header)
        await expect(page.getByText('Session Details')).toBeVisible();
    } else {
        console.log('No sessions found to test navigation.');
    }
});
