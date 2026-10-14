import { Alert } from '@/components/ui/alert';
import { CircleCheck } from 'lucide-react';

/** The result of the last action (?n= note, ?e= error), at the top of a page. */
export function Flash({ n, e }: { n?: string; e?: string }) {
  if (!n && !e) return null;
  return e ? (
    <Alert>{e}</Alert>
  ) : (
    <div className="flex items-start gap-2 rounded-xl bg-success-lighter px-3.5 py-3 text-left">
      <CircleCheck className="mt-0.5 size-4 shrink-0 text-success-base" />
      <p className="text-label-sm text-success-base">{n}</p>
    </div>
  );
}
