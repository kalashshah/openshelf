import { Alert } from '@/components/ui/alert';
import { Flash } from './flash';

/** Banners every dashboard page starts with: demo store, nowhere to send money, the last action's result. */
export function Notices({ demo, canTakePayments, n, e }: { demo: boolean; canTakePayments: boolean; n?: string; e?: string }) {
  return (
    <>
      {demo && <Alert variant="info">This is a demo store on the PayPal sandbox. Buy anything with test card 4005 5192 0000 0004 or a PayPal sandbox account.</Alert>}
      {!canTakePayments && (
        <Alert>
          Open Shelf doesn’t know where to send your money yet, so agents can’t buy.{' '}
          <a href="/app/settings" className="underline underline-offset-2">
            Add your PayPal
          </a>
        </Alert>
      )}
      <Flash n={n} e={e} />
    </>
  );
}
