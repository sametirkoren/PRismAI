# Quick Start Guide

## Immediate Next Steps

You have a working Next.js 15 application with all core dependencies installed. Here's what you need to do to get it running:

## 1. Set Up Environment Variables (Required)

Create `.env.local` file:

```bash
cp .env.example .env.local
```

Then fill in these **required** values:

### Generate NextAuth Secret
```bash
openssl rand -base64 32
```
Add this to `NEXTAUTH_SECRET` in `.env.local`

### GitHub OAuth (Required for login)
1. Go to: https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - Name: `PRism AI Local`
   - Homepage: `http://localhost:3000`
   - Callback: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID → `AUTH_GITHUB_ID`
5. Generate Client Secret → `AUTH_GITHUB_SECRET`

### Supabase (Required for database)
1. Go to: https://supabase.com/dashboard
2. Create new project
3. Go to Settings > Database
4. Copy **Connection Pooling** string → `DATABASE_URL`
5. Copy **Direct Connection** string → `DIRECT_URL`
6. Go to Settings > API
7. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
8. Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
9. Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### Anthropic API (Required for AI reviews)
1. Go to: https://console.anthropic.com
2. Get API key → `ANTHROPIC_API_KEY`

## 2. Initialize Database

```bash
npx prisma generate
npx prisma db push
```

## 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## Quick Test

1. You should see the landing page
2. Click "Connect with GitHub"
3. Authorize the app
4. You'll be redirected to `/dashboard` (will show 404 for now - needs to be built)

## What's Done

✅ All dependencies installed
✅ Prisma schema defined
✅ NextAuth v5 configured
✅ GitHub API utilities ready
✅ Claude AI integration ready
✅ Landing page complete
✅ Button component ready

## What's Next (To Build)

1. **Dashboard page** (`app/dashboard/page.tsx`)
   - Fetch and display open PRs
   - Filter by repository
   - Show review status

2. **Review page** (`app/dashboard/review/[owner]/[repo]/[pr]/page.tsx`)
   - Review type selection
   - Start AI review
   - Display results
   - Submit to GitHub

3. **Components**
   - PR Card
   - Review Type Selector
   - Review Results Display
   - Loading states
   - Error boundaries

## Troubleshooting

### "Module not found" errors
```bash
npm install
npx prisma generate
```

### Database errors
- Make sure Supabase project is active
- Check DATABASE_URL and DIRECT_URL are correct
- Run `npx prisma db push` again

### Auth errors
- Verify GitHub OAuth callback URL is exactly `http://localhost:3000/api/auth/callback/github`
- Check NEXTAUTH_URL and NEXTAUTH_SECRET are set

## Development Tips

- Use `npx prisma studio` to view database
- Check console for errors
- NextAuth debug: Add `debug: true` in `lib/auth/config.ts`
- Use React DevTools browser extension

## Ready to Code?

The foundation is solid. Start building the dashboard and review pages next!

See `README.md` for full documentation.
