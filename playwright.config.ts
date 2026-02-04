import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

export default defineConfig({
    testDir: './tests',
    testMatch: '**/*.spec.ts',
    // Limit parallel tests to prevent zombie processes
    fullyParallel: false,
    workers: 2,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: 'list',
    // Global timeout for each test
    timeout: 30000,
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        // Shorter timeouts to fail fast
        actionTimeout: 10000,
        navigationTimeout: 15000,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 60000,
    },
    // Force cleanup
    globalTeardown: undefined,
});
