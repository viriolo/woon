# Database Setup Guide for Woon App

## 🎯 **Current Status**
- ✅ Supabase project configured: `lkeznjzvrikphdqwdlwo.supabase.co`
- ✅ Environment variables set up
- ✅ Migration files ready
- ⏳ Database schema needs to be applied

## 📋 **Step-by-Step Migration Process**

### **Step 1: Access Supabase Dashboard**
1. Go to [supabase.com](https://supabase.com)
2. Sign in and navigate to your project: `lkeznjzvrikphdqwdlwo`
3. Go to **SQL Editor** in the left sidebar

### **Step 2: Apply Migrations in Order**

#### **Migration 1: CMS Schema**
```sql
-- Copy and paste the contents of: supabase/migrations/001_create_cms_schema.sql
-- This creates the content management system tables
```

#### **Migration 2: Initial Data**
```sql
-- Copy and paste the contents of: supabase/migrations/002_seed_initial_data.sql
-- This seeds initial content types and categories
```

#### **Migration 3: User Auth System**
```sql
-- Copy and paste the contents of: supabase/migrations/003_create_user_auth_system.sql
-- This creates user profiles, achievements, follows, and events tables
```

#### **Migration 4: User Data**
```sql
-- Copy and paste the contents of: supabase/migrations/004_seed_user_data.sql
-- This seeds initial achievements and user data
```

#### **Migration 5: Celebrations System**
```sql
-- Copy and paste the contents of: supabase/migrations/005_create_celebrations_system.sql
-- This creates celebrations and comments tables
```

#### **Migration 6: Fix Celebration References** ⚠️ **CRITICAL**
```sql
-- Copy and paste the contents of: supabase/migrations/006_fix_celebration_references.sql
-- This fixes the celebration_likes and celebration_saves table references
```

#### **Migration 7: Fix Schema Mismatches** ⚠️ **CRITICAL**
```sql
-- Copy and paste the contents of: supabase/migrations/007_fix_schema_mismatches.sql
-- This fixes table name mismatches and adds missing user profile fields
```

### **Step 3: Enable Realtime**
1. Go to **Database** → **Replication** in Supabase dashboard
2. Enable realtime for these tables:
   - `celebrations`
   - `celebration_comments`
   - `events`
   - `event_rsvps`

### **Step 4: Configure Authentication**
1. Go to **Authentication** → **Settings**
2. Configure providers (Google, GitHub, etc.) if needed
3. Set up email templates if desired

### **Step 5: Test Database Connection**
Run this test script to verify everything is working:

```typescript
// Test script - run in browser console on your app
import { supabase } from './services/supabaseClient';

async function testDatabase() {
  try {
    // Test user profiles
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    console.log('✅ User profiles table:', profiles, profileError);
    
    // Test celebrations
    const { data: celebrations, error: celebrationError } = await supabase
      .from('celebrations')
      .select('*')
      .limit(1);
    
    console.log('✅ Celebrations table:', celebrations, celebrationError);
    
    // Test events
    const { data: events, error: eventError } = await supabase
      .from('events')
      .select('*')
      .limit(1);
    
    console.log('✅ Events table:', events, eventError);
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabase();
```

## 🚨 **Important Notes**

### **Migration Order is Critical**
- Must run migrations 1-7 in exact order
- Migration 6 fixes critical schema issues from migration 3
- Migration 7 fixes table name mismatches and adds missing fields
- Don't skip any migrations

### **Data Types**
- `celebrations.id` is BIGINT (not UUID)
- `celebration_likes.celebration_id` references `celebrations.id` as BIGINT
- `celebration_saves.celebration_id` references `celebrations.id` as BIGINT

### **RLS Policies**
- All tables have Row Level Security enabled
- Policies allow proper access control
- Users can only modify their own data

## 🔧 **Alternative: Install Supabase CLI**

If you prefer command-line management:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref lkeznjzvrikphdqwdlwo

# Apply migrations
supabase db push
```

## ✅ **Verification Checklist**

After applying all migrations:

- [ ] All 7 migrations applied successfully
- [ ] No SQL errors in Supabase dashboard
- [ ] Realtime enabled for celebrations and events
- [ ] Authentication providers configured
- [ ] Test script runs without errors
- [ ] App can connect to database
- [ ] User registration works
- [ ] Celebration creation works
- [ ] Event creation works

## 🆘 **Troubleshooting**

### **Common Issues:**
1. **Foreign key errors**: Ensure migrations run in order
2. **RLS policy errors**: Check that policies are created after tables
3. **Realtime not working**: Verify replication is enabled
4. **Auth errors**: Check authentication settings

### **Reset Database (if needed):**
```sql
-- DANGER: This will delete all data
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

## 🎉 **Next Steps After Migration**

1. Test user registration and login
2. Test celebration creation
3. Test event creation and RSVP
4. Verify realtime updates work
5. Test social features (follows, likes, saves)
6. Deploy to production with confidence!

