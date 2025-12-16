# Database Files Reference

Quick reference guide for all database-related SQL files in this project.

## Files Overview

| File | Purpose | When to Use |
|------|---------|-------------|
| **supabase-schema-complete.sql** | ✅ **RECOMMENDED** - Complete, up-to-date schema | Fresh installations or complete reset |
| **supabase-schema.sql** | ⚠️ **OUTDATED** - Original schema | Reference only - DO NOT USE |
| **supabase-migration-feedback-threads.sql** | Migration: Add threading | If updating existing database |
| **supabase-migration-feedback-title.sql** | Migration: Add titles | If updating existing database |
| **DATABASE_SETUP.md** | Setup instructions | Learn how to use the schema files |
| **MIGRATION_INSTRUCTIONS.md** | Migration guide | Step-by-step migration process |

## Recommended Approach

### For New Projects (Fresh Installation)

**Use: `supabase-schema-complete.sql`**

This single file contains everything you need:
- All 8 tables with latest updates
- All indexes (12 total)
- All functions and triggers
- All RLS policies (18 total)
- Threaded feedback support
- Feedback titles
- Gap management
- Everything configured correctly

**Steps:**
1. Open Supabase SQL Editor
2. Copy entire contents of `supabase-schema-complete.sql`
3. Paste and run
4. Done! ✅

### For Existing Projects (Incremental Updates)

**Use: Migration files in order**

If you already have the basic schema running:

1. First, run `supabase-migration-feedback-threads.sql`
   - Adds `parent_id` column
   - Adds index for threading
   - Enables reply functionality

2. Then, run `supabase-migration-feedback-title.sql`
   - Adds `title` column
   - Adds constraint for titles
   - Enables titled feedback threads

**Steps:**
1. Run migration 1
2. Verify it worked
3. Run migration 2
4. Done! ✅

## What Each File Contains

### `supabase-schema-complete.sql` ✅ USE THIS

**Contains:**
```
✅ All 8 tables with latest columns
✅ parent_id column (threading)
✅ title column (feedback titles)
✅ 12 indexes
✅ 2 functions
✅ 6 triggers
✅ 18 RLS policies
✅ Default AI settings
✅ Automatic profile creation
✅ Completion message
```

**Features:**
- Threaded feedback with parent/child relationships
- Required titles for top-level feedback
- Optional titles for replies (automatically null)
- Multi-owner projects
- Gap CRUD operations
- Soft deletes throughout
- Full Row Level Security

### `supabase-schema.sql` ⚠️ OUTDATED

**Status:** DEPRECATED - For reference only

**Missing:**
- ❌ parent_id column (no threading)
- ❌ title column (no titles)
- ❌ Recent bug fixes

**Why kept:** Historical reference

### `supabase-migration-feedback-threads.sql`

**Adds:**
```sql
ALTER TABLE feedback
  ADD COLUMN parent_id UUID
  REFERENCES feedback(id)
  ON DELETE CASCADE;

CREATE INDEX idx_feedback_parent_id
  ON feedback(parent_id)
  WHERE deleted_at IS NULL;
```

**Use when:** You have existing database and need threading

### `supabase-migration-feedback-title.sql`

**Adds:**
```sql
ALTER TABLE feedback
  ADD COLUMN title TEXT;

ALTER TABLE feedback
  ADD CONSTRAINT feedback_title_check CHECK (
    (parent_id IS NULL AND title IS NOT NULL AND title != '')
    OR (parent_id IS NOT NULL)
  );
```

**Use when:** You have threading and need titles

## Schema Versions

### Version 1.0 (Original)
- Basic tables
- No threading
- No titles
- File: `supabase-schema.sql` ❌

### Version 2.0 (Threading)
- Added parent_id
- Supports replies
- File: `supabase-migration-feedback-threads.sql`

### Version 3.0 (Titles) ✅ CURRENT
- Added title column
- Required for top-level feedback
- File: `supabase-schema-complete.sql` ✅

## Quick Decision Tree

```
Do you have an existing database?
│
├─ NO (Fresh start)
│  └─ Use: supabase-schema-complete.sql ✅
│
└─ YES (Existing database)
   │
   ├─ Want to keep existing data?
   │  └─ Use: Migration files (incremental)
   │     1. supabase-migration-feedback-threads.sql
   │     2. supabase-migration-feedback-title.sql
   │
   └─ OK to lose data?
      └─ Use: supabase-schema-complete.sql ⚠️
         (WARNING: Deletes everything)
```

## Verification Commands

After running any schema file, verify with:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check feedback has new columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'feedback'
AND column_name IN ('parent_id', 'title');

-- Check constraint exists
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'feedback'
AND constraint_name = 'feedback_title_check';
```

## Common Issues

### "column already exists"
- You've already run this migration
- Or you're using the complete schema on an existing database
- Solution: Skip that migration or use complete schema

### "column does not exist: parent_id"
- You haven't run the threading migration
- Solution: Run `supabase-migration-feedback-threads.sql` first

### "column does not exist: title"
- You haven't run the title migration
- Solution: Run `supabase-migration-feedback-title.sql`

## Need Help?

1. **Fresh installation?** → Use `supabase-schema-complete.sql`
2. **Incremental update?** → See `MIGRATION_INSTRUCTIONS.md`
3. **Detailed setup?** → See `DATABASE_SETUP.md`
4. **Still stuck?** → Check error messages and verify file order

## File Locations

All database files are in the project root:
```
/supabase-schema-complete.sql          ✅ RECOMMENDED
/supabase-schema.sql                   ⚠️ OUTDATED
/supabase-migration-feedback-threads.sql
/supabase-migration-feedback-title.sql
/DATABASE_SETUP.md                     📖 INSTRUCTIONS
/MIGRATION_INSTRUCTIONS.md             📖 MIGRATIONS
/DATABASE_FILES_REFERENCE.md           📖 THIS FILE
```

## Last Updated

This reference was last updated with schema version 3.0, which includes:
- Threaded feedback (v2.0)
- Feedback titles (v3.0)
- All latest features and bug fixes
