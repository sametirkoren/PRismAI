# Contributing to PRism AI

Thank you for your interest in contributing to PRism AI! 🎉

## Getting Started

### 1. Fork & Clone

```bash
git clone https://github.com/YOUR_USERNAME/codereview-ai.git
cd codereview-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Your Environment

PRism AI includes a **Setup Wizard** that makes configuration easy:

1. Copy the example env file:
   ```bash
   cp .env.example .env
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser at http://localhost:3000

4. Follow the Setup Wizard which will guide you through:
   - Creating a Supabase project (free tier is enough)
   - Getting a Claude API key from Anthropic
   - Setting up GitHub OAuth for authentication
   - Running database migrations

5. After setup completes, restart the dev server:
   ```bash
   # Press Ctrl+C to stop
   npm run dev
   ```

That's it! You're ready to start contributing.

## Development Workflow

### Making Changes

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Test your changes locally

4. Commit with clear messages:
   ```bash
   git commit -m "feat: add new feature"
   ```

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

### Pull Request Process

1. Push your branch:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Open a Pull Request on GitHub

3. Describe your changes:
   - What does this PR do?
   - Why is it needed?
   - Any breaking changes?

4. Wait for review and address any feedback

## Project Structure

```
prism-ai/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── setup/             # Setup wizard
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── ...               # Feature components
├── lib/                   # Utilities and configs
│   ├── api/              # External API integrations
│   ├── auth/             # Authentication config
│   └── setup/            # Setup wizard logic
├── prisma/               # Database schema
└── types/                # TypeScript types
```

## Code Style

- Use TypeScript for type safety
- Follow existing code patterns
- Use meaningful variable and function names
- Add comments for complex logic
- Keep components small and focused

## Testing

Before submitting a PR:

1. Test the UI manually
2. Check for TypeScript errors:
   ```bash
   npm run build
   ```
3. Run linting:
   ```bash
   npm run lint
   ```

## Need Help?

- Check existing issues on GitHub
- Ask questions in pull request comments
- Reach out to maintainers

## Code of Conduct

Be respectful, inclusive, and collaborative. We're all here to build something great together!

---

Thank you for contributing to PRism AI! 🚀
