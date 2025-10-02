# Netlify Deployment Guide

## Prerequisites
- GitHub repository connected to your Netlify account
- Supabase project with the migrations in `supabase/migrations` applied
- Local `.env.local` configured and tested

## 1. Prepare the Repository
1. Commit and push the latest changes to the branch you plan to deploy (typically `main`).
2. Run `npm run build` locally to confirm the project builds without warnings you were not expecting.
3. Ensure `supabase/migrations` have been executed against your Supabase instance. You can run:
   ```sh
   npx supabase db push
   ```
   or copy the SQL into the Supabase SQL Editor.

## 2. Connect the Site to Netlify
1. Sign in to [Netlify](https://www.netlify.com/).
2. Click **Add new site -> Import an existing project**.
3. Choose **GitHub**, authorize if prompted, then pick the `woon` repository.
4. Configure the build settings:
   - **Base directory**: leave empty (repository root)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18`
5. Click **Deploy site** to trigger the first build. The build will fail if environment variables are not yet in place—this is expected.

## 3. Configure Environment Variables
Add the following keys in **Site settings -> Environment variables**:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

Tips:
- Use **Deploy settings -> Environment** to add variables before the next deploy.
- For secrets, consider using Netlify’s [environment variable scopes](https://docs.netlify.com/environment-variables/).

## 4. Re-run the Deployment
1. After the variables are set, trigger a redeploy from the **Deploys** tab (pick the latest deploy and click **Retry deploy**).
2. Wait for the build to finish. A successful deploy will show a green checkmark and a preview URL.

## 5. Post-Deployment Checklist
- Visit the deployed site and exercise the main flows:
  - Sign up / sign in and profile editing
  - Discovery map with celebrations and friend layers
  - Celebration creation (including AI helpers when keys are present)
  - Comments with @mentions and likes/saves
  - Event creation and RSVP flows
  - Admin dashboard (Profile -> Content Management)
- Confirm Supabase Realtime events update the map and event lists.
- Check the browser console for CSP or network violations.

## 6. Security & CSP Notes
- `netlify.toml` configures a Content Security Policy; update the domains if you introduce new third-party services.
- Do not expose the Supabase service role key or any server-side secrets in client-side variables.
- Supabase Row Level Security (RLS) policies must remain enabled for protected tables.

## 7. Ongoing Maintenance
- Every push to the connected branch triggers a new deploy. Use Netlify Deploy Previews for pull requests.
- Re-run `npm run build` locally before pushing significant changes.
- Keep Supabase migrations versioned—never edit existing migration files after they have been applied.

With these steps complete, the production site will stay in sync with Netlify, Supabase, and the repository.



