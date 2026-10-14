import { CircleCheck, MessageCircle } from 'lucide-react';
import { EmptyPanel, PageBody, PageHeader, Row, Rows, SectionCard } from '@/components/app/chrome';
import { Notices } from '@/components/app/notices';
import { Submit } from '@/components/app/submit';
import { Input } from '@/components/ui/input';
import * as StatusBadge from '@/components/ui/status-badge';
import { dashboard } from '@/server/page-context';
import type { Question } from '@/server/store';
import { answerQuestionAction } from '../actions';

function when(ms: number) {
  return new Date(ms).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });
}

function Item({ q, answerable }: { q: Question; answerable: boolean }) {
  return (
    <Row className="items-start">
      <MessageCircle className="mt-0.5 size-4 shrink-0 text-text-sub-600" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="text-label-sm text-text-strong-950">{q.question}</p>
        <p className="text-paragraph-xs text-text-sub-600">Store agent: {q.answer}</p>
        {q.merchantAnswer && (
          <div className="rounded-10 bg-success-lighter px-3 py-2 text-paragraph-sm text-text-strong-950">
            <span className="block text-paragraph-xs text-success-base">Your answer · the agent uses this now</span>
            {q.merchantAnswer}
          </div>
        )}
        {answerable && (
          <form action={answerQuestionAction.bind(null, q.id)} className="mt-1 flex flex-col gap-2 sm:flex-row">
            <Input name="answer" required placeholder="Answer once; every future shopper’s agent gets it" />
            <Submit pending="Saving…" className="shrink-0">
              Teach the agent
            </Submit>
          </form>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <StatusBadge.Root status="disabled" variant="stroke">
          {q.asker}
        </StatusBadge.Root>
        <span className="text-paragraph-xs text-text-soft-400">{when(q.createdAt)}</span>
      </div>
    </Row>
  );
}

export default async function Questions({ searchParams }: { searchParams: Promise<{ n?: string; e?: string }> }) {
  const { store, shop, user, canTakePayments } = await dashboard();
  const { n, e } = await searchParams;
  const qs = await store.questions(shop.id, 300);
  const open = qs.filter((q) => !q.answered && !q.merchantAnswer);
  const rest = qs.filter((q) => q.answered || q.merchantAnswer);
  return (
    <>
      <PageHeader title="Questions" description="What shoppers’ agents and people asked your store. Answer what it didn’t know once, and it knows from then on." />
      <PageBody className="max-w-5xl">
        <Notices demo={user.isAnonymous} canTakePayments={canTakePayments} n={n} e={e} />
        <SectionCard
          icon={<MessageCircle />}
          tone={open.length ? 'primary' : 'neutral'}
          title="Waiting for you"
          description="The store agent said it didn’t know and passed these to you."
          action={
            <StatusBadge.Root status={open.length ? 'pending' : 'completed'} variant="light">
              <StatusBadge.Dot />
              {open.length ? `${open.length} open` : 'All caught up'}
            </StatusBadge.Root>
          }
        >
          {open.length ? (
            <Rows>
              {open.map((q) => (
                <Item key={q.id} q={q} answerable />
              ))}
            </Rows>
          ) : (
            <EmptyPanel icon={<CircleCheck />} title="All caught up" description="New questions your store agent can’t answer will show up here." />
          )}
        </SectionCard>
        <SectionCard icon={<CircleCheck />} title="Answered" description="Answered by the store agent from your catalog and notes, or by you.">
          {rest.length ? (
            <Rows>
              {rest.map((q) => (
                <Item key={q.id} q={q} answerable={false} />
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
