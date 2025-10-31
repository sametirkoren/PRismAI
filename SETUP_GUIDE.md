# 🚀 Setup Guide for Local Development

This guide will help you set up PRism AI on your local machine.

## Prerequisites

- Node.js 20.x or higher
- GitHub account
- Supabase account (free tier is sufficient)
- Anthropic API account (optional - can be configured later)

## Step 1: Clone & Install

```bash
git clone <your-repository-url>
cd codereview-ai
npm install
```

## Step 2: Environment Setup

### Create Environment File

```bash
cp .env.example .env.local
```

### Configure Required Variables

Open `.env.local` and fill in the following:

#### 2.1 Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Copy the output and paste it into `NEXTAUTH_SECRET`

#### 2.2 GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: `PRism AI (Local Dev)`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Copy **Client ID** → Add to `AUTH_GITHUB_ID`
6. Click "Generate a new client secret"
7. Copy **Client Secret** → Add to `AUTH_GITHUB_SECRET`

#### 2.3 Supabase Setup (Database - REQUIRED)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in project details and wait for setup to complete
4. Go to **Settings → Database**
5. Find "Connection string" section
6. Copy **Connection pooling** → Add to `DATABASE_URL`
7. Copy **Direct connection** → Add to `DIRECT_URL`

**Important**: `DATABASE_URL` and `DIRECT_URL` are REQUIRED in `.env.local` for the app to work.

#### 2.4 API Keys (Two Options)

You have two ways to configure Claude API and Supabase credentials:

##### Option A: Via Environment Variables (Traditional)

Add to `.env.local`:

**Supabase API Keys:**
1. In Supabase, go to **Settings → API**
2. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

**Claude API Key:**
1. Go to [Anthropic Console](https://console.anthropic.com)
2. Sign up/Login
3. Go to API Keys
4. Click "Create Key"
5. Copy the key → `ANTHROPIC_API_KEY`

##### Option B: Via Settings Page (Recommended for Open Source)

This is the recommended approach if you're sharing the code or contributing to open source:

1. Skip adding `ANTHROPIC_API_KEY` and Supabase keys to `.env.local`
2. Complete the database setup (steps 2.1-2.3)
3. Start the app and log in with GitHub
4. Go to **Settings → API Keys**
5. Enter your Claude API key
6. Scroll down to Supabase Configuration
7. Enter your Supabase URL, Anon Key, and Service Role Key

**Benefits of Option B:**
- Each user uses their own API keys
- No need to share sensitive credentials
- Perfect for open-source projects
- Keys are securely stored in the database per user

## Step 3: Database Migration

```bash
npx prisma generate
npx prisma db push
```

## Step 4: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 5: First Login & Configuration

1. Click "Connect with GitHub"
2. Authorize the application
3. You'll be redirected to the dashboard

### If You Chose Option B (Settings Page):

4. Click "Settings" in the sidebar
5. Go to "API Keys" tab
6. Enter your Claude API key
7. Scroll to "Supabase Configuration"
8. Enter your Supabase credentials
9. Click "Save Changes"

## Verification

### Test GitHub Connection
- You should see your repositories in the dashboard
- If not, check your GitHub OAuth settings

### Test Database Connection
- Try creating a review
- Check if data is saved in Supabase (use Supabase Dashboard → Table Editor)

### Test Claude API
- Start a code review
- If it fails, verify your API key in Settings

## Troubleshooting

### "Module not found" errors
```bash
npm install
npx prisma generate
```

### Database connection errors
- Verify `DATABASE_URL` and `DIRECT_URL` in `.env.local`
- Check if Supabase project is active
- Run `npx prisma db push` again

### GitHub OAuth errors
- Verify callback URL is exactly: `http://localhost:3000/api/auth/callback/github`
- Check `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are set

### Claude API errors
- If using `.env.local`: Check `ANTHROPIC_API_KEY` is correct
- If using Settings page: Go to Settings → API Keys and verify the key

### Supabase API errors
- If using `.env.local`: Check all three Supabase keys
- If using Settings page: Go to Settings → API Keys → Supabase Configuration

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Open Prisma Studio (database viewer)
npx prisma studio

# Reset database (⚠️ deletes all data)
npx prisma db push --force-reset
```

## Security Notes

- Never commit `.env.local` to version control
- Keep your `NEXTAUTH_SECRET` secure
- Don't share your API keys publicly
- Service role keys have admin access - keep them secure
- When using Settings page, keys are stored encrypted in the database

## Next Steps

- Read [README.md](./README.md) for project overview
- Check [QUICKSTART.md](./QUICKSTART.md) for quick reference
- Explore the dashboard and try reviewing a PR

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review the console for error messages
3. Check Supabase logs in the dashboard
4. Ensure all prerequisites are installed

Happy coding! 🎉
