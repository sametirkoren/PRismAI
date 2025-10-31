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

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the **required** values:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<run: openssl rand -base64 32>

# GitHub OAuth (REQUIRED)
AUTH_GITHUB_ID=<your-github-oauth-client-id>
AUTH_GITHUB_SECRET=<your-github-oauth-client-secret>

# Database (REQUIRED)
DATABASE_URL=<your-supabase-postgres-connection-string>
DIRECT_URL=<your-supabase-postgres-direct-connection>

# Claude API & Supabase (Optional - can be configured via Settings page after login)
ANTHROPIC_API_KEY=<your-anthropic-api-key>
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
```

**Note:** Claude API and Supabase credentials can be configured either in `.env.local` OR via the Settings page after logging in. This allows users to use their own API keys without modifying the codebase.

### 3. GitHub OAuth App

1. Go to [GitHub Settings > Developer Settings > OAuth Apps](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: PRism AI (Local)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Copy the Client ID and generate a Client Secret
5. Add them to `.env.local`

### 4. Supabase Setup

1. Create a new project at [Supabase](https://supabase.com)
2. Go to Project Settings > Database
3. Copy the connection strings (both pooled and direct)
4. Add them to `.env.local`

### 5. Anthropic API Key

**Option 1: Environment Variable (Recommended for development)**
1. Sign up at [Anthropic Console](https://console.anthropic.com)
2. Generate an API key
3. Add it to `.env.local`

**Option 2: Via Settings Page (Recommended for open-source usage)**
1. Sign up at [Anthropic Console](https://console.anthropic.com)
2. Generate an API key
3. After logging in, go to Settings → API Keys
4. Enter your Claude API key

This allows each user to use their own API key without sharing credentials.

### 6. Database Migration

```bash
npx prisma generate
npx prisma db push
```

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

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
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx prisma studio    # Open Prisma Studio
npx prisma generate  # Generate Prisma Client
npx prisma db push   # Push schema to database
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
