# PRism AI

AI-powered code review platform for GitHub pull requests using Claude 3.5 Sonnet.

## Features

- 🤖 AI-powered code reviews with Claude 3.5 Sonnet
- 🔐 Secure GitHub OAuth authentication
- 🎯 Specialized review types (Backend, Frontend, Mobile)
- ⚡ Fast reviews (< 30 seconds)
- 🏷️ Automatic PR labeling
- 💬 Direct GitHub PR comments
- 📊 Review history and tracking

## Tech Stack

- **Framework**: Next.js 15 (App Router, React Server Components)
- **Language**: TypeScript
- **Auth**: NextAuth.js v5 + GitHub OAuth
- **Database**: Supabase PostgreSQL + Prisma ORM
- **AI**: Anthropic Claude 3.5 Sonnet
- **GitHub**: Octokit REST API
- **UI**: Tailwind CSS + Radix UI + Framer Motion
- **Icons**: Lucide React

## Prerequisites

- Node.js 20.x or higher
- GitHub account
- Supabase account
- Anthropic API key

## 🌐 Live Demo

**Note:** The live demo at the production URL is for showcase purposes only and redirects to this GitHub repository. To use PRism AI, you need to:

1. Clone this repository
2. Set up your own environment variables
3. Run it locally or deploy to your own server

This is because PRism AI requires your own:
- Claude API key (from Anthropic)
- GitHub OAuth App credentials
- Supabase/PostgreSQL database

### Testing Production Mode Locally

To test the production homepage (GitHub redirect) locally:

1. Set `NEXT_PUBLIC_SHOW_GITHUB_LINK=true` in `.env.local`
2. Restart the development server: `npm run dev`
3. The homepage will show "GitHub'da Görüntüle" button instead of login

### Deploy to Vercel

For detailed Vercel deployment instructions, see [VERCEL_SETUP.md](./VERCEL_SETUP.md)

## Setup Instructions

### Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your `.env.local` with required credentials (see below)

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   The script will automatically:
   - ✅ Check database connection
   - ✅ Run migrations if needed
   - ✅ Generate Prisma Client
   - ✅ Start the development server

4. **Access Application**
   
   Navigate to [http://localhost:3000](http://localhost:3000) and sign in with GitHub

---

### Environment Configuration

#### 1. Environment Variables

Fill in your `.env` file:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<run: openssl rand -base64 32>

# GitHub OAuth
AUTH_GITHUB_ID=<your-github-oauth-client-id>
AUTH_GITHUB_SECRET=<your-github-oauth-client-secret>

# Supabase
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

# Database
DATABASE_URL=<your-supabase-postgres-connection-string>
DIRECT_URL=<your-supabase-postgres-direct-connection>

# Claude API
ANTHROPIC_API_KEY=<your-anthropic-api-key>
```

#### 2. GitHub OAuth App

1. Go to [GitHub Settings > Developer Settings > OAuth Apps](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: PRism AI (Local)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Copy the Client ID and generate a Client Secret

#### 3. Supabase Setup

1. Create a new project at [Supabase](https://supabase.com)
2. Go to Project Settings > Database
3. Copy connection strings:
   - Transaction mode (for DATABASE_URL)
   - Session mode (for DIRECT_URL)
4. Copy API keys from Settings > API

#### 4. Anthropic API Key

1. Sign up at [Anthropic Console](https://console.anthropic.com)
2. Generate an API key

#### 5. Database Migration

```bash
npx prisma generate
npx prisma migrate deploy
```

#### 6. Run Development Server

```bash
npm run dev
```

## Usage

1. **Sign In**: Click "Connect with GitHub" on the landing page
2. **Authorize**: Grant GitHub access to read repos and add comments
3. **Dashboard**: View all your open pull requests
4. **Select PR**: Choose a PR to review
5. **Choose Review Type**: Select Backend, Frontend, or Mobile
6. **Start Review**: AI analyzes the code
7. **View Results**: See categorized issues (Critical, Suggestions, Best Practices)
8. **Submit to GitHub**: Add "AI Reviewed" label and post comments

## Project Structure

```
prism-ai/
├── app/
│   ├── api/
│   │   └── auth/[...nextauth]/route.ts
│   ├── dashboard/          # Dashboard pages (to be created)
│   ├── layout.tsx
│   └── page.tsx            # Landing page
├── components/
│   └── ui/
│       └── button.tsx      # Reusable UI components
├── lib/
│   ├── api/
│   │   ├── claude.ts       # Claude AI integration
│   │   └── github.ts       # GitHub API utilities
│   ├── auth/
│   │   └── config.ts       # NextAuth configuration
│   ├── utils/
│   │   └── cn.ts           # Utility functions
│   └── prisma.ts           # Prisma client
├── prisma/
│   └── schema.prisma       # Database schema
├── types/
│   └── index.ts            # TypeScript types
└── .env.example            # Environment template
```

## Database Schema

- **Users**: User accounts with GitHub OAuth
- **Accounts**: OAuth accounts (GitHub tokens)
- **Sessions**: User sessions (database strategy)
- **Reviews**: PR review data with AI results

## Scripts

```bash
npm run dev           # Start development server (auto-checks DB)
npm run dev:watch     # Dev server with auto-restart on .env changes
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Run ESLint

# Database commands
npm run db:migrate    # Run database migrations
npm run db:generate   # Generate Prisma Client
npm run db:push       # Push schema changes to database
npm run db:studio     # Open Prisma Studio
```

## Development Status

- [x] Project setup and dependencies
- [x] Prisma schema and database
- [x] NextAuth v5 configuration
- [x] GitHub API integration
- [x] Claude AI integration
- [x] Landing page
- [ ] Dashboard page
- [ ] PR listing and filtering
- [ ] Review type selection
- [ ] Review results display
- [ ] GitHub integration (labels & comments)
- [ ] Error handling and loading states

## Security

- OAuth tokens encrypted at rest
- HTTPS only in production
- CSRF protection via NextAuth
- Input validation
- Database connection pooling

---

Built with Next.js 15, TypeScript, and Claude AI
