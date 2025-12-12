# Getting Started with AppCollab

This guide will walk you through setting up and running your AppCollab hackathon collaboration platform.

## Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account (free tier works fine)
- (Optional) API keys for AI providers

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

### 2.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose an organization or create one
4. Name your project (e.g., "appcollab")
5. Set a strong database password
6. Choose a region close to you
7. Click "Create new project"
8. Wait 2-3 minutes for the project to be created

### 2.2 Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** > **API**
2. Find and copy:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
3. Go to **Settings** > **Database**
4. Scroll down to find your **service_role key**
5. Copy this key (⚠️ Keep this secret!)

### 2.3 Run the Database Migration

1. In your Supabase project, go to **SQL Editor**
2. Click **+ New query**
3. Open `supabase-schema.sql` from this project
4. Copy ALL the contents
5. Paste into the Supabase SQL Editor
6. Click **Run** (bottom right)
7. You should see "Success. No rows returned" - this is correct!

### 2.4 Verify the Setup

Go to **Table Editor** in Supabase and verify these tables were created:
- profiles
- projects
- project_gaps
- gap_contributors
- feedback
- feature_suggestions
- ai_settings
- ai_usage_logs

## Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. (Optional) Add AI provider API keys:
   ```env
   # Add at least ONE of these for AI features
   OPENAI_API_KEY=sk-...
   GOOGLE_API_KEY=...
   ANTHROPIC_API_KEY=sk-ant-...
   ```

   **Getting AI API Keys:**
   - OpenAI: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Google (Gemini): [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
   - Anthropic (Claude): [console.anthropic.com/account/keys](https://console.anthropic.com/account/keys)

   Note: You can start without AI keys and add them later. AI features just won't be available until configured.

## Step 4: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 5: Create Your First User

1. Go to http://localhost:3000
2. You'll be redirected to the login page
3. Click "create a new account"
4. Fill in:
   - Email address
   - Username
   - Full name (optional)
   - Password (min 6 characters)
5. Click "Create account"
6. You'll be automatically logged in and redirected to the dashboard

## Step 6: Set Up Admin Access (Optional)

To access admin features, you need to manually set a user as admin:

1. Go to your Supabase project
2. Go to **Table Editor** > **profiles**
3. Find your user (by email/username)
4. Click on the **role** cell
5. Change it from `user` to `admin`
6. Click save
7. Refresh your AppCollab page
8. You should now see an "Admin" link in navigation or can access `/admin`

## Step 7: Configure AI Settings (If Using AI)

If you added AI API keys:

1. Sign in as an admin user
2. Go to **Admin** > **AI Settings** (or `/admin/settings`)
3. Select which AI model to use (ChatGPT, Gemini, or Claude)
4. Click "Save Changes"
5. AI features are now active!

## What You Can Do Now

### As a Regular User:
- ✅ Create and manage your profile with skills
- ✅ Browse all projects
- ✅ Create new projects with gap/need specifications
- ✅ Tag yourself to help with specific project gaps
- ✅ Provide feedback on projects
- ✅ Suggest features for projects
- ✅ Upvote feature suggestions
- ✅ Use AI to enhance your feedback and descriptions (if configured)

### As an Admin:
- ✅ View usage statistics and metrics
- ✅ Switch between AI models without restarting
- ✅ View AI usage logs and token consumption
- ✅ See all users and projects
- ✅ Access historical records

## Testing the AI Features

If you configured AI:

1. Create or view a project
2. In the feedback section, write some basic feedback
3. (Coming soon) Click "Enhance with AI" to improve it
4. View the enhanced version with token usage displayed

## Common Issues & Solutions

### "Unauthorized" or "Forbidden" errors
- Make sure you're logged in
- For admin features, ensure your user role is set to "admin" in Supabase

### AI features not working
- Check that you have at least one AI API key configured in `.env.local`
- Restart the dev server after adding API keys
- Verify the API key is valid
- Check the admin settings page to see which models are available

### Database errors
- Verify you ran the complete SQL migration in Supabase
- Check that all tables exist in Table Editor
- Ensure RLS policies are enabled

### Build errors
- Delete `.next` folder and `node_modules`
- Run `npm install` again
- Run `npm run build` to check for errors

## Production Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Add all environment variables from `.env.local`
6. Click "Deploy"
7. Your app will be live in minutes!

### Environment Variables for Production

Make sure to add these in Vercel's settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (optional)
- `GOOGLE_API_KEY` (optional)
- `ANTHROPIC_API_KEY` (optional)
- `NEXT_PUBLIC_APP_URL` (set to your production URL)

## Project Structure

```
/app
  /(auth)           - Login and signup pages
  /(main)           - Main app (requires auth)
    /dashboard      - User dashboard
    /projects       - Project listing and details
    /profile        - User profile page
    /admin          - Admin dashboard and tools
  /api              - API routes
/components
  /ui               - Base UI components
  /navigation       - Navbar, settings modal
  /projects         - Project-related components
  /feedback         - Feedback components
/lib
  /supabase         - Supabase client setup
  /ai               - AI service and providers
  /db               - Database query functions
  /hooks            - Custom React hooks
/prompts            - Externalized AI prompts (hot-reloadable)
/types              - TypeScript type definitions
```

## Customizing AI Prompts

All AI prompts are in `/prompts` directory as `.txt` files. You can edit them and changes take effect immediately (no restart needed):

- `feedback-enhancement.txt` - Improve feedback
- `project-description-enhancement.txt` - Improve project descriptions
- `feature-suggestion-enhancement.txt` - Improve feature suggestions
- `skill-matching.txt` - Match users to projects
- `gap-analysis.txt` - Suggest project gaps
- `project-summary.txt` - Generate summaries

## Need Help?

- Check the main README.md for feature details
- Review the database schema in `supabase-schema.sql`
- Check browser console for errors
- Verify Supabase logs in your project dashboard

## Next Steps

Now that you're set up, try:
1. Creating a test project
2. Adding your skills to your profile
3. Tagging yourself to help with a project
4. Leaving feedback on a project
5. Exploring the admin dashboard (if you're an admin)

Happy collaborating! 🚀
