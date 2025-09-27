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
VITE_GOOGLE_MAPS_API_KEY=AIzaSyC-Lw0q4c_zbPNX8tyt3CVGfHxbtPAzFxY
```

### 4. **Configure OAuth in Supabase**
⚠️ **Important**: Update OAuth redirect URLs in Supabase Dashboard:
1. Go to Authentication → Providers in your Supabase dashboard
2. For each OAuth provider (Google, Facebook):
   - Add your Netlify URL: `https://your-app-name.netlify.app/auth/callback`
   - Keep development URL: `http://localhost:5173/auth/callback`

### 5. **Deploy**
1. Click "Deploy site"
2. Wait for build to complete (~2-3 minutes)
3. Your site will be available at your Netlify URL
4. **Test authentication flows** to ensure OAuth works properly

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

## 🔧 Troubleshooting

### Build Issues
- **Environment variables not found**: Ensure all `VITE_*` variables are set in Netlify
- **TypeScript errors**: Run `npm run build` locally to identify issues
- **Missing dependencies**: Clear Netlify build cache and redeploy

### Authentication Issues
- **OAuth redirect fails**:
  1. Check redirect URLs in Supabase match your Netlify domain exactly
  2. Ensure `auth/callback` is included in the URL
  3. Verify environment variables are set correctly
- **Social login buttons disabled**: Check that OAuth providers are enabled in Supabase
- **"Not authenticated" errors**: Verify Supabase anon key and URL are correct

### API Integration Issues
- **Google Maps not loading**: Check `VITE_GOOGLE_MAPS_API_KEY` is valid
- **Gemini AI not working**: Verify `VITE_GEMINI_API_KEY` has proper quotas
- **Database connection errors**: Ensure Supabase URL and anon key are correct

### Performance Issues
- **Large bundle size**: The app uses code splitting, but bundles >500kB are normal for React apps
- **Slow initial load**: Consider implementing lazy loading for heavy components

## 🚨 Security Checklist

- ✅ OAuth redirect URLs restricted to your domain
- ✅ CSP headers configured for external resources
- ✅ Environment variables properly scoped with `VITE_` prefix
- ✅ Supabase RLS policies enabled for data protection
- ✅ API keys have minimal required permissions