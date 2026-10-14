import { Bot, Check, ShoppingBag } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Wordmark } from '@/components/brand';
import { Nav } from '@/components/landing/nav';
import { FancyButton } from '@/components/ui/fancy-button';
import { paypalLoginEnabled } from '@/server/auth';
import { getEnv } from '@/server/env';
import { currentUser } from '@/server/session';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sign in' };

/** What a store looks like to a shopper's agent: the tile beside the form. */
function WelcomeTile() {
  return (
    <div className="relative flex aspect-[16/11] w-full flex-col justify-end overflow-hidden rounded-2xl bg-gray-950 p-5 shadow-regular-md ring-1 ring-line lg:aspect-[4/5]">
      <div className="absolute inset-0 bg-[radial-gradient(600px_300px_at_80%_0%,rgba(125,82,244,.35),transparent_70%)]" />
      <div className="relative flex flex-col gap-3">
        <span className="self-start rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">Your store, as an agent sees it</span>
        <div className="self-end rounded-2xl rounded-br-md bg-white px-3.5 py-2.5 text-[13px] text-gray-950">Moisturizer for oily skin, under $30?</div>
        <div className="flex max-w-[85%] items-start gap-2 rounded-2xl rounded-bl-md bg-white/[0.08] px-3.5 py-2.5 text-[13px] text-gray-200 ring-1 ring-white/10">
          <Bot className="mt-0.5 size-4 shrink-0 text-[#a897ff]" />
          The Oil-Free Gel Moisturizer: non-comedogenic, no fragrance, $24.
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] p-3 ring-1 ring-white/10">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/10 text-white">
            <ShoppingBag className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-white">Approved in PayPal</p>
            <p className="text-xs text-gray-400">$24.00 · paid to your account</p>
          </div>
          <Check className="size-4 text-green-400" />
        </div>
      </div>
    </div>
  );
}

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  if (await currentUser()) redirect('/app');
  const { next, error } = await searchParams;
  return (
    <div id="top" className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1240px] flex-col border-line bg-card xl:border-x">
        <Nav
          brand={
            <a href="/">
              <Wordmark />
            </a>
          }
          links={[
            { href: '/#how', label: 'How it works' },
            { href: '/s/dewdrop', label: 'Demo store' },
          ]}
          action={
            <FancyButton asChild variant="basic" size="small">
              <a href="/">Home</a>
            </FancyButton>
          }
        />
        <main className="mx-auto grid w-full max-w-5xl flex-1 content-center items-center gap-8 px-6 py-8 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:py-16">
          <div className="mx-auto w-full max-w-md lg:order-2 lg:max-w-none">
            <WelcomeTile />
          </div>
          <div className="flex justify-center lg:justify-start">
            <LoginForm paypalEnabled={paypalLoginEnabled(getEnv())} error={error} next={next?.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/app'} />
          </div>
        </main>
      </div>
    </div>
  );
}
