# Vercel Deployment Setup

## 🚀 Quick Deploy to Vercel

### Step 1: Environment Variables

Go to your Vercel project settings and add these environment variables:

#### Required Variables

```env
# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production

# Production Mode (set to 'true' for showcase, 'false' for normal operation)
NEXT_PUBLIC_SHOW_GITHUB_LINK=true

# NextAuth Configuration
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# GitHub OAuth (create at https://github.com/settings/developers)
AUTH_GITHUB_ID=<your-github-oauth-client-id>
AUTH_GITHUB_SECRET=<your-github-oauth-client-secret>

# Database (from Supabase)
DATABASE_URL=<your-supabase-connection-string>
DIRECT_URL=<your-supabase-direct-connection>

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

# Claude API
ANTHROPIC_API_KEY=<your-anthropic-api-key>
```

### Step 2: GitHub OAuth App Setup

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: PRism AI
   - **Homepage URL**: `https://your-domain.vercel.app`
   - **Authorization callback URL**: `https://your-domain.vercel.app/api/auth/callback/github`
4. Copy Client ID and Secret to Vercel environment variables

### Step 3: Supabase Setup

1. Create a project at https://supabase.com
2. Go to Settings > Database
3. Copy connection strings:
   - **Transaction mode** → `DATABASE_URL`
   - **Session mode** → `DIRECT_URL`
4. Go to Settings > API
5. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

### Step 4: Generate NextAuth Secret

Run this command locally:
```bash
openssl rand -base64 32
```

Copy the output to `NEXTAUTH_SECRET` in Vercel.

### Step 5: Deploy

1. Push your code to GitHub
2. Vercel will automatically deploy
3. Prisma Client will be generated automatically during build (via `postinstall` script)

**Note:** The `package.json` includes:
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && next build"
  }
}
```

This ensures Prisma Client is always up-to-date on Vercel.

## 🎯 Production Modes

### Showcase Mode (Recommended for Public Demo)

Set `NEXT_PUBLIC_SHOW_GITHUB_LINK=true`

- Homepage shows "GitHub'da Görüntüle" button
- Redirects to GitHub repository
- No login functionality
- Perfect for portfolio/showcase

### Normal Operation Mode

Set `NEXT_PUBLIC_SHOW_GITHUB_LINK=false`

- Homepage shows "GitHub ile Başla" button
- Full login and dashboard functionality
- Requires all environment variables
- For personal/team use

## 🔒 Security Notes

1. **Never commit `.env.local`** - It's in `.gitignore`
2. **Use Vercel's environment variables** - They're encrypted
3. **Rotate secrets regularly** - Especially `NEXTAUTH_SECRET`
4. **Limit GitHub OAuth scope** - Only request necessary permissions

## 🐛 Troubleshooting

### Build Fails

- Check all environment variables are set
- Ensure `DATABASE_URL` is accessible from Vercel
- Check Vercel build logs for specific errors

### Database Connection Issues

- Verify Supabase connection strings
- Check if Supabase project is active
- Ensure connection pooling is enabled (use `?pgbouncer=true`)

### GitHub OAuth Not Working

- Verify callback URL matches exactly
- Check GitHub OAuth app is active
- Ensure `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` are correct

### NextAuth Errors

- Regenerate `NEXTAUTH_SECRET`
- Verify `NEXTAUTH_URL` matches your domain
- Check browser cookies are enabled

## 📊 Monitoring

Add these integrations in Vercel:

1. **Vercel Analytics** - Track page views and performance
2. **Sentry** - Error tracking and monitoring
3. **LogDrain** - Centralized logging

## 💰 Cost Estimation

- **Vercel**: Free tier (Hobby plan)
- **Supabase**: Free tier (500MB database)
- **Claude API**: Pay-per-use (~$0.003 per review)

Total: **$0-5/month** for light usage

## 🔄 Updates

To update your deployment:

1. Push changes to GitHub
2. Vercel auto-deploys
3. Run migrations if schema changed:
   ```bash
   npx prisma migrate deploy
   ```

## 📞 Support

For deployment issues:
- Check [Vercel Documentation](https://vercel.com/docs)
- Check [Supabase Documentation](https://supabase.com/docs)
- Open an issue on GitHub
