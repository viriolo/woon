# Netlify Environment Variables Setup

## 🎯 Your Neon Database Connection

You've successfully created your Neon database! Here's how to configure it for production deployment on Netlify.

## Environment Variables to Add in Netlify

Go to your Netlify dashboard → Site Settings → Environment Variables and add these:

### 1. Database Configuration
```
Variable name: DATABASE_URL
Value: postgresql://neondb_owner:npg_Y2UlubfQ7qwM@ep-square-unit-a7b6z3ky-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require
```

### 2. Your API Keys
```
Variable name: GEMINI_API_KEY
Value: [Your Gemini API key - you'll need to add this]

Variable name: VITE_MAPBOX_ACCESS_TOKEN
Value: pk.eyJ1Ijoidmlpbm5vIiwiYSI6ImNtZnA5bmh6ZDBkcDMybXBzbmZqMWs1cXAifQ.1LFslO7Ge-PEuiNEYT5DYw
```

## 🚀 Deployment Steps

1. **Add Environment Variables**
   - Go to Netlify Dashboard
   - Select your Woon site
   - Go to Site Settings → Environment Variables
   - Click "Add a variable"
   - Add all three variables above

2. **Trigger New Deploy**
   - Go to Deploys tab
   - Click "Trigger deploy" → "Deploy site"
   - Or push any change to GitHub (auto-deploys)

3. **Verify Database Connection**
   - Once deployed, check the deploy logs
   - Look for "Database initialized successfully" message
   - Test user registration/login functionality

## ✅ What This Enables

With your Neon database connected, your Woon app now has:

🔐 **Real User Accounts**: Persistent user registration and authentication
🔒 **Secure Passwords**: bcrypt hashing with 12 salt rounds
📱 **Session Management**: 7-day secure session tokens
👥 **Multi-user Support**: Multiple users can use the app simultaneously
💾 **Data Persistence**: All celebrations, events, and user data saved permanently
🌍 **Production Ready**: Scalable PostgreSQL database infrastructure

## 🔧 Troubleshooting

### Build Failures
- Ensure all environment variables are set correctly
- Check that DATABASE_URL doesn't have extra spaces or characters
- Verify Neon database is active (not sleeping)

### Connection Issues
- Test your DATABASE_URL by connecting directly with a PostgreSQL client
- Ensure your Neon database allows connections from all IPs
- Check Netlify deploy logs for specific error messages

### Development vs Production
- Local development: Uses `.env.local` file (not committed to git)
- Production: Uses Netlify environment variables
- App gracefully falls back to localStorage if database is unavailable

## 🎉 Success!

Once configured, your next deployment will:
1. Connect to your Neon database
2. Automatically create all necessary tables
3. Enable full user management features
4. Provide a production-ready user experience

Your Woon app is now ready for real users with persistent accounts and data!