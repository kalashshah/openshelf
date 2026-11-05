import { Bot, CircleCheck, MessageCircle, Sparkles, Undo2, User, X } from 'lucide-react';
import { EmptyPanel, PageBody, PageHeader, Rows, SectionCard } from '@/components/app/chrome';
import { Notices } from '@/components/app/notices';
import { Submit } from '@/components/app/submit';
import { Input } from '@/components/ui/input';
import * as StatusBadge from '@/components/ui/status-badge';
import { dashboard } from '@/server/page-context';
import type { Question } from '@/server/store';
import { answerQuestionAction, dismissQuestionAction } from '../actions';

function when(ms: number) {
  return new Date(ms).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });
}

function Item({ q, product, answerable }: { q: Question; product?: string; answerable: boolean }) {
  const Asker = q.asker === 'agent' ? Bot : User;
  return (
    <div className="flex gap-3 px-4 py-4">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-bg-weak-50 text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200">
        <Asker className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <p className="text-label-md text-text-strong-950">{q.question}</p>
            <span className="text-paragraph-xs text-text-soft-400">{when(q.createdAt)}</span>
          </div>
          <p className="mt-0.5 text-paragraph-xs text-text-sub-600">
            {q.kind === 'refund_request' ? 'Refund request · refund it under Orders if you agree · ' : ''}
            {q.asker === 'agent' ? 'From a shopper’s AI agent' : 'From your store page'}
            {product && <> · about {product}</>}
          </p>
        </div>
        <div className="max-w-[80ch] rounded-xl bg-bg-weak-50 px-3.5 py-2.5 ring-1 ring-inset ring-stroke-soft-200">
          <span className="flex items-center gap-1.5 text-label-xs text-text-sub-600">
            <Sparkles className="size-3.5 text-primary-base" /> {q.kind === 'refund_request' ? 'Open Shelf replied' : 'Store agent replied'}
          </span>
          <p className="mt-1 text-paragraph-sm text-text-strong-950">{q.answer}</p>
        </div>
        {q.merchantAnswer && (
          <div className="max-w-[80ch] rounded-xl bg-success-lighter px-3.5 py-2.5">
            <span className="flex items-center gap-1.5 text-label-xs text-success-base">
              <CircleCheck className="size-3.5" /> {q.kind === 'refund_request' ? 'Your note · private' : 'Your answer · the agent uses this now'}
            </span>
            <p className="mt-1 text-paragraph-sm text-text-strong-950">{q.merchantAnswer}</p>
          </div>
        )}
        {answerable ? (
          <div className="flex flex-col gap-2">
            <AnswerForm id={q.id} refund={q.kind === 'refund_request'} />
            <form action={dismissQuestionAction.bind(null, q.id)}>
              <button type="submit" className="flex items-center gap-1 text-label-xs text-text-sub-600 hover:text-text-strong-950 hover:underline">
                <X className="size-3.5" /> {q.kind === 'refund_request' ? 'Mark handled' : 'Dismiss without answering'}
              </button>
            </form>
          </div>
        ) : (
          !q.merchantAnswer && (
            <details className="group">
              <summary className="w-fit cursor-pointer list-none text-label-xs text-primary-base hover:underline">Add or correct the answer</summary>
              <div className="mt-2">
                <AnswerForm id={q.id} />
              </div>
            </details>
          )
        )}
      </div>
    </div>
  );
}

function AnswerForm({ id, refund = false }: { id: string; refund?: boolean }) {
  return (
    <form action={answerQuestionAction.bind(null, id)} className="flex max-w-[80ch] flex-col gap-2 sm:flex-row">
      <Input name="answer" required maxLength={4000} placeholder={refund ? 'A private note, e.g. “Refunded after the return arrived”' : 'Answer once; every future shopper’s agent gets it'} />
      <Submit pending="Saving…" className="shrink-0">
        {refund ? 'Save note' : 'Teach the agent'}
      </Submit>
    </form>
  );
}

export default async function Questions({ searchParams }: { searchParams: Promise<{ n?: string; e?: string }> }) {
  const { store, shop, user, canTakePayments } = await dashboard();
  const { n, e } = await searchParams;
  const [qs, products] = await Promise.all([store.questions(shop.id, 300), store.products(shop.id, { includeInactive: true })]);
  const names = new Map(products.map((p) => [p.id, p.name]));
  // Refund requests carry order ids and complaints: shown apart, and never taught to the store agent.
  const refunds = qs.filter((q) => q.kind === 'refund_request' && !q.resolvedAt);
  const asked = qs.filter((q) => q.kind === 'question');
  const open = asked.filter((q) => !q.answered && !q.resolvedAt);
  const rest = asked.filter((q) => q.answered || q.merchantAnswer);
  return (
    <>
      <PageHeader title="Questions" description="What shoppers’ agents and people asked your store. Answer what it didn’t know once, and it knows from then on." />
      <PageBody>
        <Notices demo={user.isAnonymous} canTakePayments={canTakePayments} n={n} e={e} />
        <SectionCard
          icon={<MessageCircle />}
          tone={open.length ? 'primary' : 'neutral'}
          title="Waiting for you"
          description="The store agent said it didn’t know and passed these to you."
          bodyClassName={open.length ? 'pb-0' : undefined}
          action={
            <StatusBadge.Root status={open.length ? 'pending' : 'completed'} variant="light">
              <StatusBadge.Dot />
              {open.length ? `${open.length} open` : 'All caught up'}
            </StatusBadge.Root>
          }
        >
          {open.length ? (
            <Rows className="border-b-0">
              {open.map((q) => (
                <Item key={q.id} q={q} product={names.get(q.productId ?? '')} answerable />
              ))}
            </Rows>
          ) : (
            <EmptyPanel icon={<CircleCheck />} title="All caught up" description="New questions your store agent can’t answer will show up here." />
          )}
        </SectionCard>
        {refunds.length > 0 && (
          <SectionCard
            icon={<Undo2 />}
            tone="primary"
            title="Refund requests"
            description="Shoppers’ agents asked for money back on a shipped order or after your refund window. Refund under Orders, or mark it handled. These stay private."
            bodyClassName="pb-0"
            action={<span className="text-paragraph-xs text-text-sub-600">{refunds.length}</span>}
          >
            <Rows className="border-b-0">
              {refunds.map((q) => (
                <Item key={q.id} q={q} answerable />
              ))}
            </Rows>
          </SectionCard>
        )}
        <SectionCard
          icon={<CircleCheck />}
          title="Answered"
          description="Answered by the store agent from your catalog and notes, or by you. Add an answer to any of them to make it stick."
          bodyClassName={rest.length ? 'pb-0' : undefined}
          action={rest.length ? <span className="text-paragraph-xs text-text-sub-600">{rest.length}</span> : undefined}
        >
          {rest.length ? (
            <Rows className="border-b-0">
              {rest.map((q) => (
                <Item key={q.id} q={q} product={names.get(q.productId ?? '')} answerable={false} />
              ))}
            </Rows>
          ) : (
            <EmptyPanel icon={<MessageCircle />} title="No questions yet" description="Ask one on your store page to see it work." />
          )}
        </SectionCard>
      </PageBody>
    </>
  );
}
