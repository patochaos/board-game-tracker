# Deployment Guide for Game Night Tracker

This guide explains how to host your application on the web so others can access it.

## 🏗 Architecture
Your app has two parts:
1.  **Frontend (Next.js)**: The visual part users interact with. We will host this on **Vercel**.
2.  **Backend (Supabase)**: The database and authentication. You are already using the cloud version at `supabase.com`.

## 💰 Cost: Free
Both services offer generous free tiers perfect for personal projects:
-   **Vercel Hobby Plan**: Free for non-commercial personal projects. Includes free SSL (https), automatic deployments, and global CDN.
-   **Supabase Free Tier**: Includes 500MB database, 1GB file storage, and 50,000 monthly active users.

---

## 🚀 Step-by-Step Deployment

### 1. Push to GitHub
If you haven't already, you need to push your code to a GitHub repository.
1.  Create a new repository on [GitHub](https://github.com/new).
2.  Run these commands in your terminal (replace `YOUR_REPO_URL`):
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin YOUR_REPO_URL
    git push -u origin main
    ```

### 2. Connect to Vercel
1.  Go to [vercel.com](https://vercel.com/signup) and sign up (easiest with your GitHub account).
2.  On your dashboard, click **"Add New..."** -> **"Project"**.
3.  Find your `board-game-tracker` repository and click **Import**.

### 3. Configure Environment Variables
Vercel needs to know your Supabase keys (the same ones in your `.env.local` file).
1.  In the "Configure Project" screen, look for **Environment Variables**.
2.  Add the following (copy values from your `.env.local` file):
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   `BGG_API_TOKEN` (if/when you have it)
3.  Click **Deploy**.

### 4. Done!
Vercel will build your site and give you a live URL (e.g., `board-game-tracker.vercel.app`).
-   Any time you `git push` changes to GitHub, Vercel will automatically redeploy your site.
-   You can connect a custom domain (like `mygamenight.com`) for free later if you buy the domain name.
