import { redirect } from 'next/navigation';
import { AgentDemo } from '@/components/landing/agent-demo';
import { SiteHeader } from '@/components/landing/site-header';
import { Reveal } from '@/components/ui/reveal';
import { paypalLoginEnabled } from '@/server/auth';
import { getEnv } from '@/server/env';
import { currentUser } from '@/server/session';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sign in' };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  if (await currentUser()) redirect('/app');
  const { next, error } = await searchParams;
  return (
    <div id="top" className="relative min-h-screen overflow-x-clip pb-12">
      <SiteHeader action={{ href: '/', label: 'Home' }} />
      <main className="mx-auto grid max-w-[1160px] items-center gap-12 px-4 pt-16 md:px-5 md:pt-24 lg:grid-cols-[1fr_1.05fr]">
        <Reveal className="flex justify-center lg:justify-start">
          <LoginForm paypalEnabled={paypalLoginEnabled(getEnv())} error={error} next={next?.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/app'} />
        </Reveal>
        <Reveal delay={200} className="mx-auto w-full min-w-0 max-w-lg lg:max-w-none">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-marker">What happens once you’re in</p>
          <AgentDemo />
        </Reveal>
      </main>
    </div>
  );
}
