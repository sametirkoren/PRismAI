# PRism AI - Setup Guide

## Quick Start (5 minutes)

### 1. Clone & Install

```bash
git clone <repo-url>
cd codereview-ai
npm install
```

### 2. Configure `.env.local`

Copy the example file:

```bash
cp .env.example .env.local
```

**Note:** The application now includes automatic database setup! When you run `npm run dev`, it will:
- ✅ Check database connection
- ✅ Run migrations automatically if needed
- ✅ Generate Prisma Client
- ✅ Start the development server

No manual migration steps required!

Edit `.env.local` and fill in all values:

#### GitHub OAuth
1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name:** PRism AI
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`
4. Copy **Client ID** → `AUTH_GITHUB_ID`
5. Generate **Client Secret** → `AUTH_GITHUB_SECRET`

#### NextAuth Secret
Generate a secret:
```bash
openssl rand -base64 32
```
Copy to `NEXTAUTH_SECRET`

#### Supabase Database
1. Go to https://supabase.com/dashboard
2. Create a new project
3. Go to **Settings → Database**
4. Copy **Connection string (Transaction mode)** → `DATABASE_URL`
5. Copy **Connection string (Session mode)** → `DIRECT_URL`
6. Go to **Settings → API**
7. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
8. Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
9. Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

#### Claude API
1. Go to https://console.anthropic.com
2. Create an API key
3. Copy to `ANTHROPIC_API_KEY`

### 3. Database Migration

```bash
npx prisma generate
npx prisma db push
```

### 4. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

### 5. Login

Click "GitHub ile Başla" and authorize with GitHub.

## Done! 🎉

You're ready to start reviewing PRs with AI!

## Troubleshooting

### "Module not found" errors
```bash
npm install
npx prisma generate
```

### Database connection errors
- Verify `DATABASE_URL` and `DIRECT_URL` in `.env.local`
- Check if Supabase project is active

### GitHub OAuth errors
- Verify callback URL is exactly: `http://localhost:3000/api/auth/callback/github`
- Check `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`

### Claude API errors
- Verify `ANTHROPIC_API_KEY` is correct
- Check your API usage limits

## Production Deployment

For production, update these in your hosting platform's environment variables:
- `NEXTAUTH_URL` → Your production URL
- All other variables from `.env.local`

Never commit `.env.local` to version control!
