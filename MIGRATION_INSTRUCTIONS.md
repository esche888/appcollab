# Database Migration Instructions

## Threaded Feedback Feature

To enable threaded feedback comments with titles, you need to run TWO database migrations.

### Migration 1: Add Threading Support

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run Migration**
   - Open the file `supabase-migration-feedback-threads.sql`
   - Copy its contents
   - Paste into the Supabase SQL Editor
   - Click "Run" to execute the migration

3. **Verify Migration**
   - Check that the `feedback` table now has a `parent_id` column
   - Verify the index was created: `idx_feedback_parent_id`

### Migration 2: Add Title Support

1. **Run Second Migration**
   - Open the file `supabase-migration-feedback-title.sql`
   - Copy its contents
   - Paste into the Supabase SQL Editor
   - Click "Run" to execute the migration

2. **Verify Migration**
   - Check that the `feedback` table now has a `title` column
   - Verify the constraint was created: `feedback_title_check`

### What This Adds:

- **parent_id column**: Allows feedback to reference a parent comment, creating threads
- **title column**: Adds a title field for top-level feedback threads
- **Index**: Improves query performance for threaded comments
- **Cascading deletes**: When a parent comment is deleted, replies are also deleted
- **Constraint**: Ensures top-level comments have titles, replies don't need them

### Using Threaded Feedback:

After running both migrations:
- Create new feedback with a title and description
- Users can reply to any top-level feedback comment
- Click "Reply" on any feedback to add a response
- Replies are indented and styled differently for clarity
- Threads are organized with parent comments first, then replies below
- Titles are displayed prominently on top-level comments only
