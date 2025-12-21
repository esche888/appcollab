# AppCollab - Hackathon Project Collaboration Platform

A web application that helps hackathon participants find collaborators to fill skill gaps in their projects. Users can register projects, advertise their needs, offer help, and provide feedback. AI enhances the collaboration experience through intelligent matching and content assistance.

## Tech Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: OpenAI GPT, Google Gemini, Anthropic Claude
- **Deployment**: Vercel

## Getting Started

### 1. Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account (free tier works fine for development)

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish setting up
3. Go to **Project Settings** > **API**
4. Copy your **Project URL** and **anon/public** key
5. Go to **Project Settings** > **Database** and copy your **service_role** key (keep this secret!)
6. Go to the **SQL Editor** and create a new query
7. Copy the entire contents of `supabase-schema-complete.sql` from this project
8. Paste it into the SQL Editor and click **Run**
9. Verify that all tables were created successfully

> **Note**: Use `supabase-schema-complete.sql` for a fresh installation. See `DATABASE_SETUP.md` for detailed instructions.

### 3. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. (Optional) Add AI provider API keys:
   ```env
   OPENAI_API_KEY=your_openai_key_here
   GOOGLE_API_KEY=your_google_key_here
   ANTHROPIC_API_KEY=your_anthropic_key_here
   ```
   Note: At least one AI provider key is recommended for full functionality.

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses the following main tables:

- **profiles** - User profiles with skills inventory
- **projects** - Hackathon projects with multi-owner support, website URLs, and GitHub links
- **project_gaps** - Skill gaps/needs for projects with status tracking
- **gap_contributors** - Users who tagged themselves to help
- **feedback** - Threaded feedback with titles (supports replies)
- **feature_suggestions** - Feature suggestions with upvotes
- **favorite_projects** - User favorites for quick access
- **best_practices** - Community best practices sharing
- **app_feedback** - Platform feedback and suggestions
- **audit_logs** - System activity and user action tracking
- **ai_settings** - AI model configuration (admin)
- **ai_usage_logs** - AI usage tracking

All tables support soft deletes via `deleted_at` timestamp.

**Latest Features**:
- ✅ Project website and GitHub URL links
- ✅ Favorites system with filtering
- ✅ Gap status management (open/filled/suspended)
- ✅ Open gaps count indicator on project cards
- ✅ Best practices sharing with upvotes
- ✅ Audit logging for admin oversight
- ✅ App feedback system
- ✅ Improved UI with gradient designs

See `DATABASE_SETUP.md` for complete schema documentation and setup instructions.

### Required Database Migrations

After setting up the initial schema, run these migrations:

```sql
-- Add gap status field
ALTER TABLE project_gaps ADD COLUMN status TEXT NOT NULL DEFAULT 'open';
ALTER TABLE project_gaps ADD CONSTRAINT project_gaps_status_check
  CHECK (status IN ('open', 'filled', 'suspended'));

-- Add project URL fields
ALTER TABLE projects ADD COLUMN website_url TEXT;
ALTER TABLE projects ADD COLUMN github_url TEXT;

-- Update project status constraint (removes 'seeking_help')
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check
  CHECK (status IN ('draft', 'idea', 'in_progress', 'on_hold', 'completed', 'archived'));

-- Create favorites table
CREATE TABLE favorite_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);
CREATE INDEX idx_favorite_projects_user_id ON favorite_projects(user_id);
CREATE INDEX idx_favorite_projects_project_id ON favorite_projects(project_id);
```

See migration files in `/supabase-migrations/` for additional features.

## Features

### Core Features
- User authentication (email/password) with audit logging
- User profiles with skills inventory
- Project registration with status tracking (draft, idea, in_progress, on_hold, completed, archived)
- Project website and GitHub repository links
- Full CRUD operations for project owners (Create, Read, Update, Delete)
- Gap/need management (idea assessment, UX design, development, deployment, commercialization, marketing)
- Gap status tracking (open, filled, suspended)
- Add, edit, and delete gaps (project owners only)
- Contributor tagging ("tag yourself" to help)
- Threaded feedback system with titles and replies
- Feature suggestions with upvoting
- **Favorites system** - Star projects for quick access and filter by favorites
- **Open gaps indicator** - Visual badges showing number of open gaps on project cards
- **Best practices sharing** - Community knowledge base with categories and upvoting
- **App feedback** - Users can submit feedback and suggestions for the platform

### AI Enhancements
- Feedback enhancement (improve clarity and tone)
- Skill matching suggestions
- Project description enhancement
- Feature suggestion improvement
- Gap analysis
- Smart project summaries

### Admin Features
- **Audit logs** - Comprehensive system activity tracking and export
- Historical records and usage tracking
- AI model switching (ChatGPT, Gemini, Claude)
- Usage statistics and metrics
- User activity oversight
- Admin dashboard with system metrics

### Technical Features
- Autosave on all forms
- Soft deletes throughout
- Token usage tracking and display
- Externalized AI prompts (hot-reloadable)
- Mobile-ready API architecture
- Comprehensive logging and audit trails
- Row-level security (RLS)
- Gradient UI design system
- Real-time updates and state management
- Client-side filtering and search

## Project Structure

```
/app
  /(auth)         - Authentication pages (login, signup)
  /(main)         - Main application pages
    /projects     - Project list, detail, create, edit
    /best-practices - Best practices sharing
    /feedback     - Platform feedback
    /admin        - Admin dashboard and audit logs
  /api            - API routes
    /projects     - Project CRUD and gaps
    /favorites    - Favorites management
    /best-practices - Best practices CRUD
    /app-feedback - Platform feedback
    /admin        - Admin functions and audit logs
/components       - React components
  /projects       - Project cards and features
  /feedback       - Feedback forms and lists
  /best-practices - Best practice components
  /admin          - Admin components
/lib
  /supabase       - Supabase clients
  /ai             - AI providers and services
  /audit          - Audit logging service
  /db             - Database queries
  /utils          - Utility functions
/prompts          - Externalized AI prompts
/types            - TypeScript type definitions
/supabase-migrations - Database migration files
```

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Building for Production
```bash
npm run build
npm start
```

## Deployment

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add your environment variables in Vercel project settings
4. Deploy!

Make sure to add all environment variables from `.env.local` to your Vercel project.

## Environment Variables

See `.env.local.example` for all required and optional environment variables.

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional (at least one recommended):
- `OPENAI_API_KEY`
- `GOOGLE_API_KEY`
- `ANTHROPIC_API_KEY`

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
