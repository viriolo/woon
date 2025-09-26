# Netlify Deployment Guide

## 🚀 Deploy to Netlify

### 1. **Push to GitHub**
```bash
git push origin main
```

### 2. **Connect to Netlify**
1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "Add new site" → "Import an existing project"
3. Choose "GitHub" and authorize Netlify
4. Select your `woon` repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18.x`

### 3. **Set Environment Variables**
In your Netlify dashboard, go to **Site settings** → **Environment variables** and add:

```
VITE_SUPABASE_URL=https://lkeznjzvrikphdqwdlwo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrZXpuanp2cmlrcGhkcXdkbHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODU2NTksImV4cCI6MjA3NDQ2MTY1OX0.lEt16OMq4Y-uVR36O9yC11CqVxLbyfDIYeCvB75Ed_k
VITE_GEMINI_API_KEY=AIzaSyDSbhUJltgDi9qzaDhJaFz2ies3yWM9iJ4
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1Ijoidmlpbm5vIiwiYSI6ImNtZnA5bmh6ZDBkcDMybXBzbmZqMWs1cXAifQ.1LFslO7Ge-PEuiNEYT5DYw
VITE_GOOGLE_MAPS_API_KEY=AIzaSyC-Lw0q4c_zbPNX8tyt3CVGfHxbtPAzFxY
```

### 4. **Deploy**
1. Click "Deploy site"
2. Wait for build to complete
3. Your site will be available at your Netlify URL

## 🎯 Features Available After Deployment

### Headless CMS
- **Admin Dashboard**: Access via Profile → Content Management
- **Content Types**: Pages, posts, events, celebrations
- **CRUD Operations**: Create, read, update, delete content
- **Categories & Tags**: Organize content
- **Media Management**: Upload and manage files

### Public API
- All content accessible via React hooks
- RESTful API endpoints
- TypeScript support
- Search and filtering capabilities

## 🔧 Post-Deployment Setup

### 1. **Test CMS Connection**
1. Visit your deployed site
2. Go to Profile tab
3. Click "🧪 Test CMS Connection"
4. Verify Supabase connection works

### 2. **Create Content**
1. Click "⚙️ Admin Dashboard"
2. Create your first content pieces
3. Test publish/unpublish functionality

### 3. **Verify Features**
- Test all navigation tabs
- Verify Google Maps integration
- Check celebration discovery features
- Test user authentication flow

## 📝 Notes

- Environment variables are automatically loaded in production
- The site uses client-side routing with proper redirects
- Security headers are configured for production
- Build optimizations are applied automatically

## 🔄 Continuous Deployment

Once connected to GitHub, Netlify will automatically deploy:
- Every push to `main` branch
- Pull request previews (optional)
- Branch deployments (optional)

Your headless CMS is production-ready! 🎉