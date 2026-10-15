import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Typography } from '@/components/ui/typography';
import { Reveal } from '@/components/ui/reveal';

/** The four square grips of a design-tool selection frame. */
export function FrameHandles({ dark = false }: { dark?: boolean }) {
  return (
    <>
      {['-top-1 -left-1', '-top-1 -right-1', '-bottom-1 -left-1', '-bottom-1 -right-1'].map(
        (pos) => (
          <span
            key={pos}
            aria-hidden
            className={cn('canvas-handle', pos, dark && 'border-white/30 bg-[#001c64]')}
          />
        ),
      )}
    </>
  );
}

/**
 * Selection frame: hairline border with corner handles, like a frame
 * selected on a design canvas.
 */
export function Frame({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('relative border border-line', className)}>
      <FrameHandles />
      {children}
    </div>
  );
}

/** Small white pill above a section title: icon + label. */
export function EyebrowPill({
  icon: Icon,
  children,
  dark = false,
}: {
  icon: LucideIcon;
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-regular-xs',
        dark
          ? 'border-white/10 bg-white/[0.06] text-blue-100'
          : 'border-line bg-card text-muted',
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {children}
    </span>
  );
}

/** Centered section header: eyebrow pill, big title, optional sub line. */
export function SectionHeader({
  icon,
  eyebrow,
  title,
  sub,
  dark = false,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: ReactNode;
  sub?: ReactNode;
  dark?: boolean;
}) {
  return (
    <Reveal className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
      <EyebrowPill icon={icon} dark={dark}>
        {eyebrow}
      </EyebrowPill>
      <Typography variant="h1" as="h2" className={cn(dark && 'text-white')}>
        {title}
      </Typography>
      {sub && (
        <Typography variant="lead" className={cn('max-w-lg', dark && 'text-blue-100/75')}>
          {sub}
        </Typography>
      )}
    </Reveal>
  );
}
