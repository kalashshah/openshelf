import { CreditCard, KeyRound, Store as StoreIcon } from 'lucide-react';
import { FieldRow, NativeSelect, PageBody, PageHeader, SectionCard } from '@/components/app/chrome';
import { FormSwitch } from '@/components/app/form-switch';
import { Notices } from '@/components/app/notices';
import { Submit } from '@/components/app/submit';
import { Input } from '@/components/ui/input';
import * as StatusBadge from '@/components/ui/status-badge';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/server/page-context';
import { CURRENCIES } from '@/server/validate';
import { connectPayPalAction, savePayeeAction, saveSettingsAction } from '../actions';

export default async function Settings({ searchParams }: { searchParams: Promise<{ n?: string; e?: string }> }) {
  const { env, shop, user, canTakePayments, mode } = await dashboard();
  const { n, e } = await searchParams;
  const connected = Boolean(shop.paypalClientId);
  return (
    <>
      <PageHeader title="Settings" description="Your store, how you get paid, and your PayPal app." />
      <PageBody>
        <Notices demo={user.isAnonymous} canTakePayments={canTakePayments} n={n} e={e} />
        <form action={saveSettingsAction}>
          <SectionCard icon={<StoreIcon />} title="Your store" description="The store agent quotes this. Anything you leave out, it says it doesn’t know." footer={<Submit pending="Saving…">Save</Submit>}>
            <div className="grid gap-5 pt-2">
              <FieldRow label="Store name" htmlFor="name">
                <Input id="name" name="name" required defaultValue={shop.name} />
              </FieldRow>
              <FieldRow label="Address" htmlFor="slug" hint={`${env.PUBLIC_URL}/s/…`}>
                <Input id="slug" name="slug" required defaultValue={shop.slug} />
              </FieldRow>
              <FieldRow label="Tagline" htmlFor="tagline" hint="What you sell, in one line.">
                <Input id="tagline" name="tagline" defaultValue={shop.tagline} />
              </FieldRow>
              <FieldRow label="About your store" htmlFor="about" hint="Policies, shipping, materials, who your products suit." wide>
                <Textarea id="about" name="about" rows={7} defaultValue={shop.about} />
              </FieldRow>
              <FieldRow label="Refund window" htmlFor="refund_days" hint="Days, 0 to 365. Automatic for shoppers’ agents inside it.">
                <Input id="refund_days" name="refund_days" type="number" min={0} max={365} defaultValue={shop.refundDays} />
              </FieldRow>
              <FieldRow label="Currency" htmlFor="currency">
                <NativeSelect name="currency" id="currency" defaultValue={shop.currency} options={CURRENCIES.map((c) => [c, c])} />
              </FieldRow>
              <FieldRow label="List publicly" hint={user.isAnonymous ? 'Demo stores stay private.' : 'The Open Shelf directory, the sitemap and Channel3 (manage it on Overview).'}>
                <FormSwitch name="listed" defaultChecked={shop.listed} disabled={user.isAnonymous} />
              </FieldRow>
            </div>
          </SectionCard>
        </form>

        <form action={savePayeeAction}>
          <SectionCard
            icon={<CreditCard />}
            tone="primary"
            title="Get paid"
            description={mode === 'app' ? 'Orders are taken by your connected PayPal app below, so refunds and tracking run through Open Shelf.' : 'Payments from shoppers and their agents go straight into this PayPal account. Logging in with PayPal fills it in.'}
            action={
              <StatusBadge.Root status={mode ? 'completed' : 'pending'} variant="light">
                <StatusBadge.Dot />
                {mode === 'payee' ? 'Receiving payments' : mode === 'app' ? 'Via your PayPal app' : mode === 'demo' ? 'Demo sandbox' : 'Not set up'}
              </StatusBadge.Root>
            }
            footer={
              <Submit pending="Saving…" variant={mode === 'app' ? 'basic' : 'primary'}>
                Save
              </Submit>
            }
          >
            <Input name="email" type="email" placeholder="you@yourpaypal.com" defaultValue={shop.paypalPayeeEmail ?? ''} disabled={mode === 'app'} />
          </SectionCard>
        </form>

        <form action={connectPayPalAction}>
          <SectionCard
            icon={<KeyRound />}
            title="Connect a PayPal app"
            description="Optional power features: import your payment links and invoices, refund automatically within your policy, and send tracking numbers to PayPal. Create an app at developer.paypal.com → Apps & Credentials (tick “Payment Links and Buttons” to import links)."
            action={
              <StatusBadge.Root status={connected ? 'completed' : 'disabled'} variant="light">
                <StatusBadge.Dot />
                {connected ? `Connected · ${shop.paypalEnv}` : 'Not connected'}
              </StatusBadge.Root>
            }
            footer={<Submit pending="Connecting…">{connected ? 'Update PayPal app' : 'Connect PayPal app'}</Submit>}
          >
            <div className="grid gap-5 pt-2">
              <FieldRow label="Environment" htmlFor="env">
                <NativeSelect name="env" id="env" defaultValue={shop.paypalEnv} options={[['sandbox', 'Sandbox'], ['live', 'Live']]} />
              </FieldRow>
              <FieldRow label="Client id" htmlFor="client_id">
                <Input id="client_id" name="client_id" required autoComplete="off" defaultValue={shop.paypalClientId ?? ''} />
              </FieldRow>
              <FieldRow label="Secret" htmlFor="client_secret" hint={connected ? 'Paste again to change it.' : undefined}>
                <Input id="client_secret" name="client_secret" type="password" required autoComplete="off" />
              </FieldRow>
            </div>
          </SectionCard>
        </form>
      </PageBody>
    </>
  );
}
