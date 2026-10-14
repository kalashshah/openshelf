import { fmt, type Variant } from './store';

/** "Size: 50 ml=24.00 | 100 ml" lines ↔ variants. */
export function variantText(vs: Variant[], currency?: string): string {
  return vs
    .map(
      (v) =>
        `${v.name}: ${v.options.map((o) => (o.price_cents !== undefined ? `${o.label}=${currency ? fmt(o.price_cents, currency) : (o.price_cents / 100).toFixed(2)}` : o.label)).join(' | ')}`,
    )
    .join('\n');
}

export function parseVariantText(text: string): Variant[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes(':'))
    .map((line) => {
      const i = line.indexOf(':');
      return {
        name: line.slice(0, i).trim(),
        options: line
          .slice(i + 1)
          .split('|')
          .map((o) => o.trim())
          .filter(Boolean)
          .map((o) => {
            const [label, price] = o.split('=').map((x) => x.trim());
            const cents = price ? Math.round(Number.parseFloat(price.replace(/[^0-9.]/g, '')) * 100) : Number.NaN;
            return Number.isFinite(cents) ? { label, price_cents: cents } : { label };
          }),
      };
    });
}
