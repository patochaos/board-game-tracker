import { test, expect } from '@playwright/test';

test('visitor can view public deck details', async ({ page }) => {
    // 0. Ensure we are not logged in (Visitor)
    await page.context().clearCookies();

    // 1. Go to the decks list
    await page.goto('/vtes/decks');

    // 2. Wait for decks to load (look for a deck card or link)
    // Avoid clicking "Import Deck" (/vtes/decks/import) which might be the first link
    // Decks have UUIDs, so we look for at least one char after decks/ that isn't 'import'
    // or better, strict UUID pattern or just verify it's a card.
    const deckLink = page.locator('a[href^="/vtes/decks/"]').filter({ hasNotText: 'Import Deck' }).first();
    await expect(deckLink).toBeVisible({ timeout: 10000 });

    // 3. Click the first deck
    await deckLink.click();

    // 4. Verify we are on the detail page
    await expect(page).toHaveURL(/\/vtes\/decks\/.+/);

    // 5. Verify core sections are visible
    await expect(page.getByRole('heading', { name: 'Crypt' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible();

    // 6. Verify author info presence (simple check that it's not empty)
    // Based on the code: current user or profile display name is shown.
    // We just want to ensure the page didn't crash and rendered the header.
    const deckTitle = page.locator('h1');
    await expect(deckTitle).toBeVisible();
});
