import { toCents } from './paypal';

/** Currencies PayPal takes with two decimals (zero-decimal ones like JPY would need different amount formatting). */
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'SGD', 'HKD', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'MXN', 'BRL', 'ILS', 'PHP', 'THB'] as const;

export interface ProductFields {
  name: string;
  priceCents: number;
  imageUrl: string | null;
  stock: number | null;
}

/** The product form's free-text fields, checked; an error says what to fix. */
export function checkProduct(f: { name: string; price: string; imageUrl: string; stock: string }): { error: string } | { value: ProductFields } {
  const name = f.name.trim();
  if (!name) return { error: 'Give the product a name.' };
  if (name.length > 127) return { error: 'Keep the name under 128 characters (PayPal shows it at checkout).' };
  const price = f.price.trim();
  if (!/^\$?\d+(\.\d{1,2})?$/.test(price.replace(/,/g, ''))) return { error: 'Price must be a number like 24 or 24.50.' };
  const priceCents = toCents(price);
  if (priceCents <= 0) return { error: 'Price must be above zero.' };
  if (priceCents > 10_000_000) return { error: 'Price is too high for a sandbox order.' };
  const stockText = f.stock.trim();
  let stock: number | null = null;
  if (stockText) {
    if (!/^\d+$/.test(stockText)) return { error: 'Stock must be a whole number of 0 or more, or blank to not track it.' };
    stock = Number(stockText);
  }
  const imageUrl = f.imageUrl.trim();
  if (imageUrl && !/^https?:\/\/\S+$/i.test(imageUrl)) return { error: 'The image must be a web address starting with http:// or https://.' };
  return { value: { name, priceCents, imageUrl: imageUrl || null, stock } };
}
