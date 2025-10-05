<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1A9LLLPHLjdUdmTp_EKs84vg1hbfoDJ_A

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` and `VITE_MAPBOX_ACCESS_TOKEN` in [.env.local](.env.local) (Gemini requires a server key; Mapbox needs a public access token)
3. Run the app:
   `npm run dev`

### Environment variables

Set these keys before running locally or deploying:

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` / `VITE_GEMINI_API_KEY` | Gemini API key for AI features |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Supabase project credentials |
| `VITE_MAPBOX_ACCESS_TOKEN` | Mapbox public access token used by the map components |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps (Places) API key |

**Local development**

Create a `.env.local` file (you can copy [.env.example](.env.example)) and add:

```bash
VITE_MAPBOX_ACCESS_TOKEN=pk.your-mapbox-public-token
```

**Netlify deployment**

1. Open Netlify > *Site settings* > *Build & deploy* > *Environment*.
2. Add **VITE_MAPBOX_ACCESS_TOKEN** with your Mapbox public token.
3. Redeploy the site so the new token is available at build time.

`VITE_` prefixed variables are exposed to the browser, which matches Vite, React, Vue, Svelte, and other modern build tools.

