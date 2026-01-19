import { test, expect } from '@playwright/test';

test('mocked session list navigation', async ({ page }) => {
    // Mock the supabase sessions query
    await page.route('**/rest/v1/sessions*', async route => {
        const json = [
            {
                id: 'test-session-123',
                played_at: '2025-01-01',
                duration_minutes: 60,
                notes: 'Test Note',
                created_at: '2025-01-01',
                game: { id: 'g1', name: 'Test Game', thumbnail_url: null },
                session_players: [],
                guest_players: []
            }
        ];
        await route.fulfill({ json });
    });

    // Listen for console logs
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    await page.goto('/sessions');

    // Wait for the session card to appear
    const card = page.getByTestId('session-card-test-session-123');
    await expect(card).toBeVisible();

    // Click it
    console.log('Attempting to click session card...');
    await card.click();

    // Verify navigation
    await expect(page).toHaveURL(/\/sessions\/test-session-123/, { timeout: 10000 });
    console.log('Navigation successful!');
});
