# Railway Database Setup Guide

Railway is an excellent alternative to Neon for hosting your PostgreSQL database.

## Setup Steps

### 1. Create Railway Account

1. Go to [Railway.app](https://railway.app)
2. Sign up with your GitHub account
3. Verify your account

### 2. Create a New Project

1. Click "New Project"
2. Select "Provision PostgreSQL"
3. Railway will automatically create a PostgreSQL database

### 3. Get Database Connection Details

1. Click on your PostgreSQL service
2. Go to the "Variables" tab
3. You'll see these environment variables:
   - `DATABASE_URL` (this is what you need)
   - `PGDATABASE`
   - `PGHOST`
   - `PGPASSWORD`
   - `PGPORT`
   - `PGUSER`

### 4. Configure Your Application

1. Copy the `DATABASE_URL` from Railway
2. Update your `.env` file:
   ```env
   DATABASE_URL=postgresql://postgres:your_password@host:port/database
   GEMINI_API_KEY=your_gemini_api_key
   VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token
   ```

### 5. Deploy Your Backend (Optional)

Railway can also host your entire application:

1. In your Railway project, click "New Service"
2. Select "GitHub Repo"
3. Connect your Woon repository
4. Railway will automatically detect it's a Node.js app
5. Set your environment variables in Railway dashboard

### 6. For Frontend (Netlify) + Backend (Railway)

**Netlify Environment Variables:**
```env
DATABASE_URL=your_railway_database_url
GEMINI_API_KEY=your_gemini_api_key
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

## Advantages of Railway

✅ **Instant Setup**: Database ready in seconds
✅ **Generous Free Tier**: $5/month in credits, no time limit
✅ **Zero Configuration**: Automatic database provisioning
✅ **Full Stack Hosting**: Can host both frontend and backend
✅ **Built-in Monitoring**: Database metrics and logs
✅ **Easy Scaling**: Upgrade as you grow

## Migration from Neon

If you have a Neon setup that's partially working, the migration is seamless:
1. Get your Railway DATABASE_URL
2. Replace the NEON_DATABASE_URL with Railway's DATABASE_URL
3. Deploy - the app will automatically create tables on first run

## Troubleshooting

### Connection Issues
- Ensure your DATABASE_URL is copied exactly from Railway
- Check that your Railway database is running (green status)
- Verify environment variables are set correctly in your deployment platform

### Development vs Production
- Use Railway for both development and production
- Railway provides different databases for different environments if needed