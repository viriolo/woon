# Supabase Setup Guide

## 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note your project URL and anon key

## 2. Install Dependencies
```bash
npm install @supabase/supabase-js
npm install --save-dev @types/pg
```

## 3. Environment Variables
Add to `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Database Setup
Run the SQL schema in your Supabase SQL editor.

## 5. Enable Authentication
1. Go to Authentication settings
2. Configure providers (Google, GitHub, etc.)
3. Set up Row Level Security policies

## 6. Enable Realtime
1. Go to Database > Replication
2. Enable realtime for: celebrations, comments, events