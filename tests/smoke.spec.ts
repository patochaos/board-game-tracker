import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Game Night Tracker/);
});

test('redirects to login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    // Since we are not authenticated, we expect to be redirected to login
    await expect(page.url()).toContain('/login');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});
