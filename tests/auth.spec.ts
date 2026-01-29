import { test, expect } from '@playwright/test';

test.describe('Authentication - Login Page', () => {
    test('login page renders correctly', async ({ page }) => {
        await page.goto('/login');

        // Check page title and heading
        await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
        await expect(page.getByText('Log in to your account')).toBeVisible();

        // Check form elements exist
        await expect(page.getByLabel('Email')).toBeVisible();
        await expect(page.getByLabel('Password')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();

        // Check Google OAuth button exists
        await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();

        // Check sign up link
        await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();
    });

    test('shows error for invalid credentials', async ({ page }) => {
        await page.goto('/login');

        // Fill in invalid credentials
        await page.getByLabel('Email').fill('invalid@test.com');
        await page.getByLabel('Password').fill('wrongpassword123');

        // Submit form
        await page.getByRole('button', { name: 'Log in' }).click();

        // Wait for error message (Supabase returns "Invalid login credentials")
        await expect(page.getByText(/invalid|error|wrong/i)).toBeVisible({ timeout: 10000 });
    });

    test('login form validates required fields', async ({ page }) => {
        await page.goto('/login');

        // Try to submit empty form - browser validation should prevent
        const emailInput = page.getByLabel('Email');
        const passwordInput = page.getByLabel('Password');

        // Check inputs have required attribute
        await expect(emailInput).toHaveAttribute('required', '');
        await expect(passwordInput).toHaveAttribute('required', '');
    });

    test('preserves next parameter in sign up link', async ({ page }) => {
        await page.goto('/login?next=/vtes-guess');

        const signUpLink = page.getByRole('link', { name: 'Sign up' });
        await expect(signUpLink).toHaveAttribute('href', /next.*vtes-guess/);
    });

    test('Google OAuth button exists and is clickable', async ({ page }) => {
        await page.goto('/login');

        const googleButton = page.getByRole('button', { name: /Continue with Google/i });
        await expect(googleButton).toBeVisible();
        await expect(googleButton).toBeEnabled();

        // Verify button has the Google SVG icon
        const svg = googleButton.locator('svg');
        await expect(svg).toBeVisible();
    });
});

test.describe('Authentication - Register Page', () => {
    test('register page renders correctly', async ({ page }) => {
        await page.goto('/register');

        // Check heading
        await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
        await expect(page.getByText('Start tracking your game nights')).toBeVisible();

        // Check form elements
        await expect(page.getByLabel('Username')).toBeVisible();
        await expect(page.getByLabel('Email')).toBeVisible();
        await expect(page.getByLabel('Password')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();

        // Check Google OAuth button
        await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();

        // Check login link
        await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
    });

    test('register form has required fields', async ({ page }) => {
        await page.goto('/register');

        // Check required attributes
        await expect(page.getByLabel('Username')).toHaveAttribute('required', '');
        await expect(page.getByLabel('Email')).toHaveAttribute('required', '');
        await expect(page.getByLabel('Password')).toHaveAttribute('required', '');
    });

    test('preserves next parameter in login link', async ({ page }) => {
        await page.goto('/register?next=/vtes-guess');

        const loginLink = page.getByRole('link', { name: 'Log in' });
        await expect(loginLink).toHaveAttribute('href', /next.*vtes-guess/);
    });

    test('navigation between login and register works', async ({ page }) => {
        // Start at login
        await page.goto('/login');
        await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

        // Go to register
        await page.getByRole('link', { name: 'Sign up' }).click();
        await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();

        // Go back to login
        await page.getByRole('link', { name: 'Log in' }).click();
        await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    });
});

test.describe('Authentication - Auth Callback', () => {
    test('callback without code redirects to login with error', async ({ page }) => {
        await page.goto('/auth/callback');

        // Should redirect to login with error parameter
        await expect(page).toHaveURL(/\/login\?error=auth/);
    });

    test('callback with invalid code redirects to login with error', async ({ page }) => {
        await page.goto('/auth/callback?code=invalid_code');

        // Should redirect to login with error parameter
        await expect(page).toHaveURL(/\/login\?error=auth/);
    });
});

test.describe('Authentication - Protected Routes', () => {
    test('dashboard redirects to login when not authenticated', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.url()).toContain('/login');
    });

    test('games page redirects to login when not authenticated', async ({ page }) => {
        await page.goto('/games');
        await expect(page.url()).toContain('/login');
    });

    test('sessions page redirects to login when not authenticated', async ({ page }) => {
        await page.goto('/sessions');
        await expect(page.url()).toContain('/login');
    });

    test('settings page is accessible (may show limited content when not authenticated)', async ({ page }) => {
        await page.goto('/settings');
        // Settings page may be accessible but show different content based on auth state
        // Just verify the page loads without error
        await expect(page).toHaveURL(/settings|login/);
    });
});
