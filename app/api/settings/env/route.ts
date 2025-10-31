import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { auth } from '@/auth';

// .env değerlerini oku
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const envLocalPath = join(process.cwd(), '.env.local');
    const envPath = join(process.cwd(), '.env');
    
    let envContent = '';
    try {
      envContent = await readFile(envLocalPath, 'utf-8');
    } catch {
      envContent = await readFile(envPath, 'utf-8');
    }

    // Parse .env content
    const envVars: Record<string, string> = {};
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          // Sadece placeholder olmayan değerleri gönder
          if (value && !value.includes('<')) {
            envVars[key.trim()] = value;
          }
        }
      }
    });

    // Sadece ilgili değerleri döndür (hassas bilgileri maskele)
    const safeEnvVars = {
      NEXT_PUBLIC_SUPABASE_URL: envVars.NEXT_PUBLIC_SUPABASE_URL || '',
      ANTHROPIC_API_KEY: envVars.ANTHROPIC_API_KEY ? '***' + envVars.ANTHROPIC_API_KEY.slice(-4) : '',
      AUTH_GITHUB_ID: envVars.AUTH_GITHUB_ID || '',
      AUTH_GITHUB_SECRET: envVars.AUTH_GITHUB_SECRET ? '***' + envVars.AUTH_GITHUB_SECRET.slice(-4) : '',
      DATABASE_URL: envVars.DATABASE_URL ? maskConnectionString(envVars.DATABASE_URL) : '',
      hasAnthropicKey: !!envVars.ANTHROPIC_API_KEY,
      hasSupabaseUrl: !!envVars.NEXT_PUBLIC_SUPABASE_URL,
      hasGithubOAuth: !!(envVars.AUTH_GITHUB_ID && envVars.AUTH_GITHUB_SECRET),
      hasDatabase: !!envVars.DATABASE_URL,
    };

    return NextResponse.json(safeEnvVars);
  } catch (error) {
    console.error('Error reading env:', error);
    return NextResponse.json({ error: 'Failed to read configuration' }, { status: 500 });
  }
}

// .env değerlerini güncelle
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      supabaseUrl, 
      supabaseAnonKey, 
      supabaseServiceRoleKey,
      databaseUrl,
      directUrl,
      anthropicApiKey,
      githubClientId,
      githubClientSecret 
    } = body;

    const envPath = join(process.cwd(), '.env');
    const envLocalPath = join(process.cwd(), '.env.local');

    // Mevcut .env'i oku
    let envContent = '';
    try {
      envContent = await readFile(envLocalPath, 'utf-8');
    } catch {
      try {
        envContent = await readFile(envPath, 'utf-8');
      } catch {
        // Dosya yoksa boş başla
        envContent = `# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# GitHub OAuth
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=

# Claude API
ANTHROPIC_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database
DATABASE_URL=
DIRECT_URL=
`;
      }
    }

    // Değerleri güncelle
    if (supabaseUrl !== undefined) {
      envContent = updateEnvVar(envContent, 'NEXT_PUBLIC_SUPABASE_URL', supabaseUrl);
    }
    if (supabaseAnonKey !== undefined) {
      envContent = updateEnvVar(envContent, 'NEXT_PUBLIC_SUPABASE_ANON_KEY', supabaseAnonKey);
    }
    if (supabaseServiceRoleKey !== undefined) {
      envContent = updateEnvVar(envContent, 'SUPABASE_SERVICE_ROLE_KEY', supabaseServiceRoleKey);
    }
    if (databaseUrl !== undefined) {
      envContent = updateEnvVar(envContent, 'DATABASE_URL', databaseUrl);
    }
    if (directUrl !== undefined) {
      envContent = updateEnvVar(envContent, 'DIRECT_URL', directUrl);
    }
    if (anthropicApiKey !== undefined) {
      envContent = updateEnvVar(envContent, 'ANTHROPIC_API_KEY', anthropicApiKey);
    }
    if (githubClientId !== undefined) {
      envContent = updateEnvVar(envContent, 'AUTH_GITHUB_ID', githubClientId);
    }
    if (githubClientSecret !== undefined) {
      envContent = updateEnvVar(envContent, 'AUTH_GITHUB_SECRET', githubClientSecret);
    }

    // NEXTAUTH_SECRET yoksa oluştur
    if (!envContent.includes('NEXTAUTH_SECRET=') || envContent.includes('NEXTAUTH_SECRET=<')) {
      const { randomBytes } = await import('crypto');
      const secret = randomBytes(32).toString('base64');
      envContent = updateEnvVar(envContent, 'NEXTAUTH_SECRET', secret);
    }

    // Her iki dosyaya da yaz
    await writeFile(envPath, envContent, 'utf-8');
    await writeFile(envLocalPath, envContent, 'utf-8');

    return NextResponse.json({ 
      success: true,
      message: 'Configuration updated. Application will restart automatically.' 
    });
  } catch (error) {
    console.error('Error updating env:', error);
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
  }
}

function updateEnvVar(content: string, key: string, value: string): string {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  
  if (regex.test(content)) {
    return content.replace(regex, `${key}=${value}`);
  } else {
    return content + `\n${key}=${value}`;
  }
}

function maskConnectionString(url: string): string {
  try {
    const urlObj = new URL(url);
    if (urlObj.password) {
      urlObj.password = '***';
    }
    return urlObj.toString();
  } catch {
    return '***';
  }
}
