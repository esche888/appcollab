# Database Setup Guide

This guide explains how to set up the AppCollab database from scratch or migrate existing databases.

## Quick Start - Fresh Database

If you're setting up a **brand new database**, use the master schema file:

### Option 1: Create Everything from Scratch

```bash
# Run this SQL file in your Supabase SQL Editor
supabase-schema-master.sql
```

This single file creates:
- ✅ All 24 tables with proper relationships
- ✅ All indexes for optimal performance
- ✅ All RLS policies for security
- ✅ Triggers for automatic timestamp updates
- ✅ User profile creation trigger
- ✅ Default AI settings

**Features Enabled:**
- Projects with gaps and contributors
- Feedback with threading and votes
- Feature suggestions with comments and votes
- Best practices with comments and requests
- App feedback system
- Recent Events page with audit logging
- AI usage tracking
- User profiles with notification preferences
- Favorite projects
- Project updates

---

## Migration Path - Existing Database

If you already have an existing database and want to add new features, run migrations in order.

### Run the Recent Events Migration

The most recent feature addition:

```bash
# Run this in Supabase SQL Editor
supabase-migration-recent-events.sql
```

Then optionally backfill existing data:

```bash
# Backfill last 30 days of activity
scripts/backfill-recent-events.sql
```

---

## Verification

After running the schema, verify everything is set up:

```sql
-- Check table count (should be 24)
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

-- Check RLS policies exist
SELECT tablename, COUNT(*) FROM pg_policies WHERE schemaname = 'public' GROUP BY tablename;
```

---

## Support

For issues:
1. Check migration files for specific features
2. Review Supabase logs for errors
3. Verify RLS policies if access is denied
