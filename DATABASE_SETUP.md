# Database Setup Guide

## Complete Schema Recreation

This guide explains how to set up or reset your Supabase database using the complete schema file.

## ⚠️ WARNING

**The complete schema script will DROP all existing tables and data!**

Only use this if:
- You're setting up the database for the first time
- You want to completely reset your database
- You have backed up any important data

## Quick Start

### 1. Access Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** (in the left sidebar)
4. Click **New Query**

### 2. Run the Complete Schema

1. Open `supabase-schema-complete.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** or press `Ctrl/Cmd + Enter`
5. Wait for completion (should take a few seconds)

### 3. Verify Setup

You should see a success message showing:
```
===========================================
Database schema recreated successfully!
===========================================
Tables created: 8
Indexes created: 12
Functions created: 2
Triggers created: 6
RLS Policies created: 18
===========================================
```

## What's Included

The complete schema includes:

### Tables
1. **profiles** - User profiles with skills and bio
2. **projects** - Project information with multiple owners
3. **project_gaps** - Help needed for projects
4. **gap_contributors** - Users who volunteer to help
5. **feedback** - Threaded feedback with titles
6. **feature_suggestions** - Feature requests with voting
7. **ai_settings** - AI model configuration (admin only)
8. **ai_usage_logs** - Track AI API usage

### Features
- ✅ **Threaded Feedback** - Parent/child comment relationships with `parent_id`
- ✅ **Feedback Titles** - Required titles for top-level feedback threads
- ✅ **Soft Deletes** - Data is marked as deleted, not physically removed
- ✅ **Row Level Security** - Proper permissions for all operations
- ✅ **Automatic Timestamps** - `created_at` and `updated_at` managed automatically
- ✅ **Profile Auto-creation** - Profiles created automatically on user signup
- ✅ **Multi-owner Projects** - Projects can have multiple owners
- ✅ **Gap Management** - Add, edit, delete project gaps (owner-only)

### Security (RLS Policies)

**Profiles:**
- Anyone can view public profiles
- Users can only update their own profile

**Projects:**
- Anyone can view projects
- Authenticated users can create projects
- Only owners can update/delete projects

**Feedback:**
- Anyone can view feedback
- Authenticated users can create feedback/replies
- Users can only edit/delete their own feedback

**Gaps & Contributors:**
- Anyone can view gaps and contributors
- Only project owners can manage gaps
- Users can tag/untag themselves as contributors

**AI Settings:**
- Only admins can view/manage AI settings
- Usage logs are tracked per user

## Migration Path

### From Existing Schema

If you already have the basic schema and just need the updates:

**Option A: Run migrations incrementally**
1. Run `supabase-migration-feedback-threads.sql` (adds `parent_id`)
2. Run `supabase-migration-feedback-title.sql` (adds `title`)

**Option B: Full reset** (⚠️ loses all data)
1. Run `supabase-schema-complete.sql`

### Fresh Installation

For new projects, just run:
```sql
-- Copy and paste the entire contents of supabase-schema-complete.sql
```

## Verification

After running the schema, verify everything is set up correctly:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should return:
-- ai_settings
-- ai_usage_logs
-- feedback
-- feature_suggestions
-- gap_contributors
-- profiles
-- project_gaps
-- projects

-- Check feedback has threading columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'feedback'
AND column_name IN ('parent_id', 'title');

-- Should return both columns
```

## Troubleshooting

### "relation does not exist" errors
- The script handles this - it drops tables before creating them
- If you see this, it means tables didn't exist (which is fine)

### Permission errors
- Make sure you're running this as a database admin
- Check that you're in the correct Supabase project

### Constraint violations
- The complete schema is designed to run on an empty database
- If you have existing data, consider backing it up first

## Next Steps

After the database is set up:

1. **Create your first user**: Sign up through your app
2. **Check profile creation**: A profile should be auto-created
3. **Test project creation**: Create a project and verify ownership
4. **Test feedback**: Add feedback with a title and verify threading works
5. **Test gaps**: Add project gaps and tag yourself as a contributor

## File Structure

```
/supabase-schema-complete.sql      # Complete schema (use this)
/supabase-schema.sql                # Original schema (outdated)
/supabase-migration-feedback-threads.sql  # Migration 1 (if incremental)
/supabase-migration-feedback-title.sql    # Migration 2 (if incremental)
```

## Support

If you encounter any issues:
1. Check the Supabase logs in the Dashboard
2. Verify you're using the correct project
3. Make sure you have admin access
4. Review the error messages carefully

The complete schema file is designed to be idempotent - you can run it multiple times (though it will delete all data each time).
