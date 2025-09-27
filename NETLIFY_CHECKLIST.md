# 🚀 Netlify Deployment Checklist for Woon

## ✅ Pre-Deployment Checklist

### 1. **Database Setup** (CRITICAL - Do This First!)
- [ ] Run the `database_migration.sql` script in Supabase Dashboard → SQL Editor
- [ ] Verify user_profiles table has all required columns
- [ ] Test that user registration works locally (should create profile automatically)

### 2. **Supabase OAuth Configuration**
- [ ] **Google OAuth**:
  - [ ] Enable Google provider in Supabase Dashboard
  - [ ] Add redirect URL: `https://YOUR-NETLIFY-URL.netlify.app/auth/callback`
  - [ ] Keep localhost URL: `http://localhost:5173/auth/callback`
- [ ] **Facebook OAuth**:
  - [ ] Enable Facebook provider in Supabase Dashboard
  - [ ] Add redirect URL: `https://YOUR-NETLIFY-URL.netlify.app/auth/callback`
  - [ ] Keep localhost URL: `http://localhost:5173/auth/callback`
- [ ] Update **Site URL** to your Netlify domain: `https://YOUR-NETLIFY-URL.netlify.app`

### 3. **Netlify Environment Variables**
Set these in Netlify Dashboard → Site Settings → Environment Variables:
- [ ] `VITE_SUPABASE_URL` = `https://lkeznjzvrikphdqwdlwo.supabase.co`
- [ ] `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- [ ] `VITE_GEMINI_API_KEY` = `AIzaSyDSbhUJltgDi9qzaDhJaFz2ies3yWM9iJ4`
- [ ] `VITE_GOOGLE_MAPS_API_KEY` = `AIzaSyC-Lw0q4c_zbPNX8tyt3CVGfHxbtPAzFxY`

### 4. **GitHub Repository**
- [ ] All changes committed and pushed to main branch
- [ ] Repository connected to Netlify
- [ ] Build settings configured:
  - Build command: `npm run build`
  - Publish directory: `dist`
  - Node version: `18`

## 🚀 Deployment Steps

### 1. **Deploy to Netlify**
1. **Link Repository**: Connect your GitHub repo to Netlify
2. **Configure Build**:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Add Environment Variables** (from checklist above)
4. **Deploy Site**

### 2. **Post-Deployment Setup**
1. **Get Your Netlify URL**: Note your app's URL (e.g., `https://wonderful-app-123.netlify.app`)
2. **Update Supabase OAuth URLs**:
   - Replace `YOUR-NETLIFY-URL` with your actual domain
   - Add to both Google and Facebook provider settings
3. **Update Site URL** in Supabase Authentication settings

### 3. **Test All Authentication Flows**
- [ ] **Email/Password Sign Up**: Create new account
- [ ] **Email/Password Sign In**: Log in with existing account
- [ ] **Google OAuth**: Test social login
- [ ] **Facebook OAuth**: Test social login
- [ ] **Sign Out**: Verify logout works
- [ ] **Profile Management**: Test profile updates

## 🔧 Troubleshooting

### **Build Fails**
- Check environment variables are set correctly in Netlify
- Verify all dependencies are in package.json
- Check build logs for specific error messages

### **Authentication Issues**
- **"Database error saving new user"**: Run the database migration script
- **OAuth redirect fails**: Check redirect URLs match your Netlify domain exactly
- **Social login buttons don't work**: Verify OAuth providers are enabled in Supabase
- **"Invalid redirect URL"**: Ensure your Netlify URL is added to Supabase OAuth settings

### **API Issues**
- **Maps not loading**: Check Google Maps API key in Netlify env vars
- **Gemini AI errors**: Verify Gemini API key has proper quotas
- **Database connection errors**: Check Supabase URL and anon key

## 🎯 Success Criteria

✅ **Your deployment is successful when:**
- [ ] Site loads without errors
- [ ] Users can sign up with email/password
- [ ] Users can log in with email/password
- [ ] Google OAuth works (redirects properly)
- [ ] Facebook OAuth works (redirects properly)
- [ ] User profiles are created automatically
- [ ] All app features work (maps, celebrations, events)
- [ ] No console errors in browser

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Review Netlify build logs
3. Check Supabase logs in Dashboard → Logs
4. Verify all environment variables are set

**Ready to deploy!** 🚀