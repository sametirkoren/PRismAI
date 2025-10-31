'use client';

import { Button } from '@/components/ui/button';
import { Github, ArrowRight } from 'lucide-react';
import { signIn } from 'next-auth/react';

export function GitHubLoginButton() {
  const handleLogin = async () => {
    await signIn('github', { callbackUrl: '/dashboard' });
  };

  return (
    <Button
      size="lg"
      onClick={handleLogin}
      className="text-lg px-8 py-6 h-auto rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transition-all"
    >
      <Github className="mr-2 h-5 w-5" />
      GitHub ile Başla
      <ArrowRight className="ml-2 h-5 w-5" />
    </Button>
  );
}
