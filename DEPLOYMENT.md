# Deployment Guide

## 🚨 Important Notice

**PRism AI is designed to run locally or on your own server.** The production deployment at the live URL is for showcase purposes only and redirects users to this GitHub repository.

## Why Local/Self-Hosted Only?

PRism AI requires sensitive credentials that should not be shared:

1. **Claude API Key** - Your personal Anthropic API key
2. **GitHub OAuth App** - Your own GitHub OAuth credentials
3. **Database** - Your own Supabase/PostgreSQL instance

Each user needs their own setup to maintain security and control costs.

## Deployment Options

### Option 1: Local Development (Recommended)

Perfect for personal use or team development:

```bash
# Clone the repository
git clone https://github.com/sametirkoren/prism-ai.git
cd prism-ai

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Fill in your credentials in .env.local

# Start development server
npm run dev
```

The app will automatically:
- ✅ Check database connection
- ✅ Run migrations
- ✅ Generate Prisma Client
- ✅ Start on http://localhost:3000

### Option 2: Self-Hosted Production

Deploy to your own server (Vercel, Railway, Render, etc.):

#### Prerequisites

1. **GitHub OAuth App**
   - Create at: https://github.com/settings/developers
   - Set callback URL to: `https://your-domain.com/api/auth/callback/github`

2. **Supabase Database**
   - Create project at: https://supabase.com
   - Get connection strings and API keys

3. **Claude API Key**
   - Get from: https://console.anthropic.com

#### Deployment Steps

1. **Fork this repository**

2. **Set up environment variables** on your hosting platform:
   ```env
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   NODE_ENV=production
   
   # Set to 'true' for showcase mode (redirects to GitHub)
   # Set to 'false' for normal operation (allows login)
   NEXT_PUBLIC_SHOW_GITHUB_LINK=false
   
   NEXTAUTH_URL=https://your-domain.com
   NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
   AUTH_GITHUB_ID=<your-github-oauth-client-id>
   AUTH_GITHUB_SECRET=<your-github-oauth-client-secret>
   DATABASE_URL=<your-supabase-connection-string>
   DIRECT_URL=<your-supabase-direct-connection>
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-key>
   ANTHROPIC_API_KEY=<your-anthropic-api-key>
   ```

3. **Deploy**
   - Connect your repository to your hosting platform
   - The platform will automatically build and deploy

4. **Run migrations** (if needed):
   ```bash
   npx prisma migrate deploy
   ```

### Option 3: Docker (Coming Soon)

Docker support will be added in a future release for easier self-hosting.

## Production Considerations

### Security

- ✅ All API keys are stored securely
- ✅ GitHub tokens are encrypted
- ✅ HTTPS only in production
- ✅ CSRF protection enabled
- ✅ Input validation on all endpoints

### Performance

- Database connection pooling via Prisma
- Optimized Next.js build
- Static page generation where possible
- Efficient API routes

### Monitoring

Consider adding:
- Error tracking (Sentry)
- Analytics (Vercel Analytics, Plausible)
- Uptime monitoring
- Database monitoring

## Cost Estimation

Running PRism AI costs:

1. **Hosting**: Free tier available on Vercel, Railway, Render
2. **Database**: Supabase free tier (500MB, 2GB bandwidth)
3. **Claude API**: Pay-per-use (~$0.003 per review)

Estimated monthly cost for moderate use: **$5-20**

## Support

For deployment issues:
- Check [SETUP.md](./SETUP.md) for configuration help
- Open an issue on GitHub
- Contact: [your-contact-info]

## License

This project is open source. See [LICENSE](./LICENSE) for details.
