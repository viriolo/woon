# Neon Database Setup Guide

This guide will help you set up a Neon PostgreSQL database for the Woon application.

## Prerequisites

1. Sign up for a [Neon account](https://neon.tech/)
2. Create a new project in your Neon dashboard

## Setup Steps

### 1. Create a Neon Database

1. Log into your Neon dashboard
2. Click "Create Project"
3. Choose a project name (e.g., "woon-production")
4. Select a region close to your users
5. Click "Create Project"

### 2. Get Your Database Connection String

1. In your Neon dashboard, go to the "Connection Details" section
2. Copy the connection string that looks like:
   ```
   postgresql://[user]:[password]@[endpoint]/[dbname]?sslmode=require
   ```

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your actual values:
   ```env
   DATABASE_URL=postgresql://your_actual_connection_string_here
   GEMINI_API_KEY=your_gemini_api_key
   VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token
   ```

### 4. Database Schema

The application will automatically create the necessary tables when it first connects:

- **users**: User accounts with authentication
- **celebrations**: User-created celebrations
- **events**: Calendar events
- **user_sessions**: Authentication sessions

### 5. For Production Deployment

#### Netlify Environment Variables

1. In your Netlify dashboard, go to Site Settings > Environment Variables
2. Add the following variables:
   - `DATABASE_URL`: Your Neon connection string
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `VITE_MAPBOX_ACCESS_TOKEN`: Your Mapbox access token

#### Railway Deployment (Alternative)

If you prefer Railway for backend deployment:

1. Create a new Railway project
2. Add environment variables in the Railway dashboard
3. Deploy your application

## Features Enabled

With Neon database integration, your Woon app now supports:

✅ **Persistent User Accounts**: Real user registration and authentication
✅ **Secure Password Hashing**: Using bcrypt for password security
✅ **Session Management**: Secure user sessions with token-based auth
✅ **Data Persistence**: All user data, celebrations, and events are stored permanently
✅ **Multi-user Support**: Multiple users can use the app simultaneously
✅ **Scalable Architecture**: Ready for production with proper database backing

## Migration from localStorage

The app will seamlessly work with both localStorage (for development) and Neon database (for production). When DATABASE_URL is not provided, it falls back to localStorage for a development-friendly experience.

## Troubleshooting

### Connection Issues
- Ensure your DATABASE_URL is correctly formatted
- Check that your Neon database is active (not sleeping)
- Verify your network allows connections to Neon endpoints

### Build Issues
- Make sure all environment variables are set in your deployment platform
- Verify that the `@neondatabase/serverless` package is included in dependencies

### Development vs Production
- Use `.env.local` for local development to avoid committing secrets
- Always use environment variables in production, never hard-code credentials