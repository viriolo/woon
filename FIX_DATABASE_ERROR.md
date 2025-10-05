# 🚨 Fix: Database Error Saving New User

## The Problem
You're getting this error when trying to log in:
```
http://localhost:5176/auth/callback?error=server_error&error_code=unexpected_failure&error_description=Database+error+saving+new+user
```

This happens because your Supabase database is missing required columns and triggers for user profile creation.

## 🔧 Quick Fix (5 minutes)

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project: `lkeznjzvrikphdqwdlwo`
3. Go to **SQL Editor** in the left sidebar

### Step 2: Run the Migration Script
1. Click **"New query"**
2. Copy the entire contents of `database_migration.sql` (in this folder)
3. Paste it into the SQL editor
4. Click **"Run"** button

### Step 3: Verify Success
You should see a success message:
```
Database migration completed successfully! ✅
You can now test user registration and authentication.
```

### Step 4: Test Authentication
1. Go back to your app at http://localhost:5173
2. Try to sign up with a new email address
3. Or try OAuth login with Google

## 🔍 What This Migration Does

1. **Adds Missing Columns** to `user_profiles`:
   - `handle`, `bio`, `location`, `avatar_url`
   - `streak_days`, `experience_points`, `level`
   - `notification_preferences`, `created_at`, `updated_at`

2. **Creates Missing Tables**:
   - `achievements` - for user badges/rewards
   - `user_achievements` - links users to their achievements
   - `celebration_likes` - tracks celebration likes
   - `celebration_saves` - tracks saved celebrations
   - `event_rsvps` - tracks event attendance
   - `user_follows` - tracks user relationships

3. **Creates Trigger Function**:
   - Automatically creates user profile when someone signs up
   - Generates unique handle from their name
   - Gives welcome achievement

4. **Sets Up Security**:
   - Enables Row Level Security (RLS)
   - Creates policies for data access control

## 🎯 After Running This:

✅ User registration will work properly
✅ OAuth login will create user profiles automatically
✅ Profile management will function correctly
✅ All app features will be enabled

## ⚠️ If You Still Get Errors:

1. **Check the SQL output** for any error messages
2. **Verify your Supabase project ID** matches what's in your `.env.local`
3. **Clear your browser cache** and try logging in again
4. **Check Supabase logs** in Dashboard → Logs for detailed error info

Run this migration and your authentication should work perfectly! 🚀