# How to Enable "Continue with Google"

The code for the Google login button is **already in your app**, but you need to connect it to Google's servers.

This involves 3 steps:
1.  Get keys from Google.
2.  Put those keys into Supabase.
3.  Add the URL to the allowed list (which you already did!).

---

### Step 1: Get Google API Keys

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a **New Project** (name it "Game Night Tracker" or similar).
3.  Select your new project.
4.  Go to **"APIs & Services"** > **"OAuth consent screen"**.
    *   **User Type**: External.
    *   **App Name**: Game Night Tracker.
    *   **Support Email**: Your email.
    *   **Developer Contact**: Your email.
    *   Click **Save and Continue** (you can skip "Scopes" and "Test Users").
5.  Go to **"Credentials"** (on the left) > **"Create Credentials"** > **"OAuth client ID"**.
    *   **Application type**: Web application.
    *   **Name**: Supabase Auth (or anything you want).
    *   **Authorized redirect URIs**:
        *   You need to get this from Supabase.
        *   Go to **Supabase Dashboard** > **Authentication** > **Providers** > **Google**.
        *   Copy the **"Callback URL (for OAuth)"** (it looks like `https://project-id.supabase.co/auth/v1/callback`).
        *   Paste that into the Google "Authorized redirect URIs" field.
    *   Click **Create**.
6.  **Copy your keys**:
    *   Copy the **Client ID**.
    *   Copy the **Client Secret**.

---

### Step 2: Add Keys to Supabase

1.  Go back to your **[Supabase Dashboard](https://supabase.com/dashboard)**.
2.  Go to **Authentication** > **Providers**.
3.  Click **Google**.
4.  Switch **Enable Google** to ON.
5.  Paste user **Client ID**.
6.  Paste your **Client Secret**.
7.  Click **Save**.

---

### Done!
Now the "Continue with Google" button on your login page will work.
