import { BRAND_COLORS, BRAND_MARKS } from '@/lib/brand-marks';
import { cn } from '@/lib/utils';

/**
 * A service's own logo, in its own colour, on a tile.
 *
 * Every connector in the app is drawn through this so the eye recognises the
 * service before it reads the label — an integration list of grey plugs looks
 * like configuration, an integration list of logos looks like the tools you
 * already use.
 *
 * The tile is the constant and the mark is the variable: white surface, hairline
 * ring, brand-coloured glyph. Tinting the *background* by brand instead would
 * put ten different colour fields next to each other and read as noise.
 */
const TILE_SIZES = {
  sm: 'size-7 rounded-lg',
  md: 'size-9 rounded-10',
  lg: 'size-11 rounded-10',
} as const;

const MARK_SIZES = {
  sm: 'size-3.5',
  md: 'size-4.5',
  lg: 'size-5',
} as const;

/** Derives the catalog key's brand: `cloudflare_docs` and `notion_2` are both known brands. */
export function brandKey(name: string): string {
  const base = name.toLowerCase().replace(/_\d+$/, '');
  if (BRAND_MARKS[base] || BRAND_COLORS[base]) return base;
  // `cloudflare_docs` -> `cloudflare`; a user-named connector keeps its own name
  // and simply falls through to the monogram.
  const head = base.split('_')[0] ?? base;
  return BRAND_MARKS[head] || BRAND_COLORS[head] ? head : base;
}

export function BrandMarkSvg({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const mark = BRAND_MARKS[brandKey(name)];
  if (!mark) return null;
  return (
    <svg viewBox={mark.viewBox ?? '0 0 24 24'} className={className} fill="currentColor" aria-hidden>
      <path d={mark.path} />
    </svg>
  );
}

export function BrandIcon({
  /** Connector or catalog name — `notion`, `cloudflare_docs`, or anything a user typed. */
  name,
  size = 'md',
  className,
}: {
  name: string;
  size?: keyof typeof TILE_SIZES;
  className?: string;
}) {
  const key = brandKey(name);
  const mark = BRAND_MARKS[key];
  const brand = mark?.hex ?? BRAND_COLORS[key];

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center shadow-regular-xs ring-1 ring-inset',
        mark ? 'bg-bg-white-0 ring-stroke-soft-200' : 'ring-transparent',
        TILE_SIZES[size],
        className,
      )}
      // Inline because these are brand data, not theme decisions — there is no
      // Tailwind class for "whatever colour Stripe is". A monogram tints its own
      // tile: a bare letter on white reads as a missing icon, the same letter on
      // its brand colour reads as the brand.
      style={
        brand
          ? mark
            ? { color: brand }
            : { color: brand, backgroundColor: `${brand}14`, boxShadow: `inset 0 0 0 1px ${brand}29` }
          : undefined
      }
      aria-hidden
    >
      {mark ? (
        <BrandMarkSvg name={name} className={MARK_SIZES[size]} />
      ) : (
        <span className={cn('font-semibold uppercase', size === 'sm' ? 'text-[11px]' : 'text-label-sm')}>
          {name.charAt(0)}
        </span>
      )}
    </span>
  );
}
