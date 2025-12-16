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
- **projects** - Hackathon projects with multi-owner support
- **project_gaps** - Skill gaps/needs for projects
- **gap_contributors** - Users who tagged themselves to help
- **feedback** - Threaded feedback with titles (supports replies)
- **feature_suggestions** - Feature suggestions with upvotes
- **ai_settings** - AI model configuration (admin)
- **ai_usage_logs** - AI usage tracking

All tables support soft deletes via `deleted_at` timestamp.

**Latest Features**:
- ✅ Threaded feedback comments (parent/child relationships)
- ✅ Feedback titles for top-level comments
- ✅ Full CRUD operations for project owners
- ✅ Gap management (add, edit, delete)

See `DATABASE_SETUP.md` for complete schema documentation and setup instructions.

## Features

### Core Features
- User authentication (email/password)
- User profiles with skills inventory
- Project registration with status tracking
- Full CRUD operations for project owners (Create, Read, Update, Delete)
- Gap/need management (idea assessment, UX design, development, deployment, commercialization, marketing)
- Add, edit, and delete gaps (project owners only)
- Contributor tagging ("tag yourself" to help)
- Threaded feedback system with titles and replies
- Feature suggestions with upvoting

### AI Enhancements
- Feedback enhancement (improve clarity and tone)
- Skill matching suggestions
- Project description enhancement
- Feature suggestion improvement
- Gap analysis
- Smart project summaries

### Admin Features
- Historical records and usage tracking
- AI model switching (ChatGPT, Gemini, Claude)
- Usage statistics and metrics
- User activity oversight

### Technical Features
- Autosave on all forms
- Soft deletes throughout
- Token usage tracking and display
- Externalized AI prompts (hot-reloadable)
- Mobile-ready API architecture
- Comprehensive logging
- Row-level security (RLS)

## Project Structure

```
/app
  /(auth)         - Authentication pages
  /(main)         - Main application pages
  /api            - API routes
/components       - React components
/lib
  /supabase       - Supabase clients
  /ai             - AI providers and services
  /db             - Database queries
  /utils          - Utility functions
/prompts          - Externalized AI prompts
/types            - TypeScript type definitions
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
