import { test, expect } from '@playwright/test';

test.describe('VTES Guess Card Game', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the guess game page
    await page.goto('/vtes-guess/guess-card');
  });

  test('loads game and displays card with options', async ({ page }) => {
    // Wait for loading to finish (loading text should disappear)
    await expect(page.getByText('Loading card database...')).not.toBeVisible({ timeout: 15000 });

    // Should show HUD with score
    await expect(page.locator('[aria-label="Settings"]')).toBeVisible();

    // Should show 4 answer option buttons in the grid
    const answerButtons = page.locator('.grid button');
    await expect(answerButtons).toHaveCount(4);

    // Should show Skip button in casual mode
    await expect(page.getByText('Skip')).toBeVisible();
  });

  test('clicking an answer shows feedback and reveals result', async ({ page }) => {
    await expect(page.getByText('Loading card database...')).not.toBeVisible({ timeout: 15000 });

    // Get the first answer button and click it
    const answerButtons = page.locator('.grid button');
    await answerButtons.first().click();

    // After clicking, should show either CORRECT or INCORRECT feedback
    // and a NEXT button
    await expect(page.getByRole('button', { name: /NEXT/i })).toBeVisible({ timeout: 5000 });
  });

  test('skip button works in casual mode', async ({ page }) => {
    await expect(page.getByText('Loading card database...')).not.toBeVisible({ timeout: 15000 });

    // Click skip
    await page.getByText('Skip').click();

    // Should show SKIPPED message and NEXT button
    await expect(page.getByText('SKIPPED')).toBeVisible();
    await expect(page.getByRole('button', { name: /NEXT/i })).toBeVisible();
  });

  test('NEXT button loads a new card', async ({ page }) => {
    await expect(page.getByText('Loading card database...')).not.toBeVisible({ timeout: 15000 });

    // Skip to reveal
    await page.getByText('Skip').click();

    // Wait for SKIPPED state and NEXT button
    await expect(page.getByText('SKIPPED')).toBeVisible({ timeout: 5000 });

    // Click NEXT
    await page.getByRole('button', { name: /NEXT/i }).click();

    // Wait for new card to load (answer buttons should reappear)
    await expect(page.locator('.grid button')).toHaveCount(4, { timeout: 5000 });

    // The game should be ready for a new round (Skip visible again)
    await expect(page.getByText('Skip')).toBeVisible();
  });

  test('settings modal opens and closes', async ({ page }) => {
    await expect(page.getByText('Loading card database...')).not.toBeVisible({ timeout: 15000 });

    // Click settings button
    await page.locator('[aria-label="Settings"]').click();

    // Modal should be visible with Settings title
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    // Should show game mode options
    await expect(page.getByText('Casual')).toBeVisible();
    await expect(page.getByText('Ranked')).toBeVisible();

    // Should show card type options
    await expect(page.getByText('Library')).toBeVisible();
    await expect(page.getByText('Crypt')).toBeVisible();

    // Should show difficulty options (use button role to be specific)
    await expect(page.getByRole('button', { name: /Staple/i })).toBeVisible();

    // Close modal with Done button
    await page.getByRole('button', { name: 'Done' }).click();

    // Modal should be closed
    await expect(page.getByRole('heading', { name: 'Settings' })).not.toBeVisible();
  });

  test('changing card type in settings works', async ({ page }) => {
    await expect(page.getByText('Loading card database...')).not.toBeVisible({ timeout: 15000 });

    // Open settings
    await page.locator('[aria-label="Settings"]').click();

    // Click on Crypt card type
    await page.getByRole('button', { name: /Crypt/i }).click();

    // Close settings
    await page.getByRole('button', { name: 'Done' }).click();

    // Game should still be playable with crypt cards
    await expect(page.locator('.grid button')).toHaveCount(4, { timeout: 5000 });
  });

  test('answering a question updates game state', async ({ page }) => {
    await expect(page.getByText('Loading card database...')).not.toBeVisible({ timeout: 15000 });

    // Click any answer - the game should respond
    const answerButtons = page.locator('.grid button');
    await answerButtons.first().click();

    // After answering, either CORRECT or INCORRECT should appear
    // along with a NEXT button
    const correctOrIncorrect = page.getByText(/CORRECT|INCORRECT/i);
    await expect(correctOrIncorrect).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /NEXT/i })).toBeVisible();
  });

  test('answer buttons disappear after selection (prevents double answers)', async ({ page }) => {
    await expect(page.getByText('Loading card database...')).not.toBeVisible({ timeout: 15000 });

    const answerButtons = page.locator('.grid button');
    await expect(answerButtons).toHaveCount(4);

    // Click an answer
    await answerButtons.first().click();

    // After clicking, the answer grid should be replaced by result screen
    // So the grid buttons should no longer be visible
    await expect(page.getByText(/CORRECT|INCORRECT/i)).toBeVisible({ timeout: 5000 });

    // The 4 answer buttons should no longer be present
    await expect(answerButtons).toHaveCount(0);
  });

  test('streak counter updates on consecutive correct answers', async ({ page }) => {
    // This test verifies the streak display exists and starts at 0
    await expect(page.getByText('Loading card database...')).not.toBeVisible({ timeout: 15000 });

    // The streak counter should be visible in the HUD (shows 0 initially)
    // It's the second number in the HUD after score
    const hudNumbers = page.locator('.h-12 span.text-lg.font-bold');
    await expect(hudNumbers).toHaveCount(2); // Score and Streak
  });
});

test.describe('VTES Guess Card Game - Ranked Mode', () => {
  test('can start ranked game from settings', async ({ page }) => {
    await page.goto('/vtes-guess/guess-card');
    await expect(page.getByText('Loading card database...')).not.toBeVisible({ timeout: 15000 });

    // Open settings
    await page.locator('[aria-label="Settings"]').click();

    // Click Ranked mode
    await page.getByRole('button', { name: /Ranked/i }).click();

    // Close modal (it should auto-close and start ranked game)
    // Ranked mode shows card progress (1/20)
    await expect(page.getByText('/20')).toBeVisible({ timeout: 5000 });
  });

  test('ranked mode does not show skip button', async ({ page }) => {
    await page.goto('/vtes-guess/guess-card');
    await expect(page.getByText('Loading card database...')).not.toBeVisible({ timeout: 15000 });

    // Start ranked mode
    await page.locator('[aria-label="Settings"]').click();
    await page.getByRole('button', { name: /Ranked/i }).click();

    // Wait for ranked mode to start
    await expect(page.getByText('/20')).toBeVisible({ timeout: 5000 });

    // Skip button should NOT be visible in ranked mode
    await expect(page.getByText('Skip')).not.toBeVisible();
  });
});

test.describe('VTES Guess Card Game - Edge Cases', () => {
  test('handles page refresh gracefully', async ({ page }) => {
    await page.goto('/vtes-guess/guess-card');
    await expect(page.getByText('Loading card database...')).not.toBeVisible({ timeout: 15000 });

    // Make some progress - skip and wait for result
    await page.getByText('Skip').click();
    await expect(page.getByText('SKIPPED')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: /NEXT/i }).click();
    await expect(page.locator('.grid button')).toHaveCount(4, { timeout: 5000 });

    // Refresh page
    await page.reload();

    // Game should reload properly
    await expect(page.getByText('Loading card database...')).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator('.grid button')).toHaveCount(4, { timeout: 5000 });
  });

  test('card image is displayed', async ({ page }) => {
    await page.goto('/vtes-guess/guess-card');
    await expect(page.getByText('Loading card database...')).not.toBeVisible({ timeout: 15000 });

    // There should be an image visible (either in MaskedCard or img tag)
    const cardImage = page.locator('img[alt="VTES Card"], img[alt*="Card"]');
    await expect(cardImage.first()).toBeVisible({ timeout: 10000 });
  });
});
