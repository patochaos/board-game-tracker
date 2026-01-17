import { test, expect } from '@playwright/test';

test('icons should load successfully', async ({ page }) => {
    // 1. Go to a deck page (we need a known deck, or we can use the list if icons are there)
    // The previous test navigated to a deck. Let's reuse that flow.
    await page.goto('/vtes/decks');
    await page.waitForLoadState('networkidle');

    // Click first deck
    const deckLink = page.locator('a[href^="/vtes/decks/"]').filter({ hasNotText: 'Import Deck' }).first();
    await deckLink.click();
    await page.waitForLoadState('networkidle');

    // 2. Check for presence of generic icons (at least one)
    // We expect some discipline/clan icons.
    // Let's grab all images inside the crypt table
    // Table selector based on page structure:
    const iconImages = page.locator('table tbody tr td img');

    // Check if we have any images
    const count = await iconImages.count();
    console.log(`Found ${count} icons initially.`);

    // If deck has no cards, this might be 0.
    // But assuming the test DB has seeded data.

    if (count > 0) {
        // Evaluate if any of them have failed (naturalWidth === 0)
        // or if they are replaced by the error span (which we can detect by checking if it's NOT an img)
    }

    // Better: Check specifically for a VtesIcon that should be there.
    // If the image is present and visible, it didn't trigger onError.

    // Wait a moment for images to potentially fail
    await page.waitForTimeout(2000);

    // If VtesIcon switched to error state, the img tag is replaced by a span.
    // So if we still see img tags, it's good (unless they are broken but didn't trigger error? unlikely with React)

    const remainingImages = await page.locator('table tbody tr td img').count();
    console.log(`Found ${remainingImages} icons after wait.`);

    // Expect at least one image if the deck has cards
    expect(remainingImages).toBeGreaterThan(0);

    // Verify specifically that we don't see the fallback text style
    // The fallback is a span with "font-mono text-[10px]"
    const errorSpans = page.locator('span.font-mono.text-\\[10px\\]');
    const errorCount = await errorSpans.count();
    console.log(`Found ${errorCount} error fallbacks.`);

    // We expect 0 errors
    expect(errorCount).toBe(0);
});
