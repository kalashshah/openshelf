// AlignUI FancyButton v0.0.0: vendored from alignui-nextjs-typescript-starter (MIT)
// Higher-emphasis CTA button: dimensional shadows + gradient overlays.
// Variants: neutral | primary | destructive | basic.
// Use for landing hero CTAs, upgrade prompts, etc. Default app buttons stay on
// the standard Button shim from ./button.

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { tv, type VariantProps } from '@/lib/tv'
import { recursiveCloneChildren } from '@/lib/recursive-clone-children'
import type { PolymorphicComponentProps } from '@/lib/polymorphic'

const FANCY_BUTTON_ROOT_NAME = 'FancyButtonRoot'
const FANCY_BUTTON_ICON_NAME = 'FancyButtonIcon'

export const fancyButtonVariants = tv({
  slots: {
    root: [
      'group relative inline-flex items-center justify-center whitespace-nowrap text-label-sm outline-none',
      'transition duration-200 ease-out',
      'focus:outline-none',
      'disabled:pointer-events-none disabled:text-text-disabled-300',
      'disabled:bg-bg-weak-50 disabled:bg-none disabled:shadow-none disabled:before:hidden disabled:after:hidden',
    ],
    icon: 'relative z-10 size-5 shrink-0',
  },
  variants: {
    variant: {
      neutral: {
        root: 'bg-bg-strong-950 text-text-white-0 shadow-fancy-buttons-neutral',
      },
      primary: {
        root: 'bg-primary-base text-static-white shadow-fancy-buttons-primary',
      },
      destructive: {
        root: 'bg-error-base text-static-white shadow-fancy-buttons-error',
      },
      basic: {
        root: [
          'bg-bg-white-0 text-text-sub-600 shadow-fancy-buttons-stroke',
          'hover:bg-bg-weak-50 hover:text-text-strong-950 hover:shadow-none',
        ],
      },
      // theme-aware: filled black on light, filled white on dark.
      // Colors flip via the AlignUI bg-strong-950 / text-white-0 tokens;
      // shadow switches from neutral (dark inner ring) to stroke (light ring
      // on white). Gradient bezel + overlay only render in light mode; they're
      // white-on-white in dark and would be invisible anyway.
      themed: {
        root: [
          // background + text (color-flips via tokens in dark mode)
          'bg-bg-strong-950 text-text-white-0',
          // shadow: dark inner ring on light, light stroke ring on dark
          'shadow-fancy-buttons-neutral dark:shadow-fancy-buttons-stroke',
          // gradient bezel + overlay (visible only on the dark light-mode button)
          'before:pointer-events-none before:absolute before:inset-0 before:z-10 before:rounded-[inherit]',
          'before:bg-gradient-to-b before:p-px before:from-static-white/[.12] before:to-transparent',
          'before:[mask-clip:content-box,border-box] before:[mask-composite:exclude] before:[mask-image:linear-gradient(#fff_0_0),linear-gradient(#fff_0_0)]',
          'after:absolute after:inset-0 after:rounded-[inherit] after:bg-gradient-to-b after:from-static-white after:to-transparent',
          'after:pointer-events-none after:opacity-[.16] after:transition after:duration-200 after:ease-out',
          'hover:after:opacity-[.24]',
          // suppress the white→transparent gradients in dark mode (white on white)
          'dark:before:hidden dark:after:hidden',
        ],
      },
    },
    size: {
      medium: { root: 'h-10 gap-3 rounded-10 px-3.5', icon: '-mx-1' },
      small: { root: 'h-9 gap-3 rounded-lg px-3', icon: '-mx-1' },
      xsmall: { root: 'h-8 gap-3 rounded-lg px-2.5', icon: '-mx-1' },
    },
  },
  compoundVariants: [
    {
      variant: ['neutral', 'primary', 'destructive'],
      class: {
        root: [
          'before:pointer-events-none before:absolute before:inset-0 before:z-10 before:rounded-[inherit]',
          'before:bg-gradient-to-b before:p-px',
          'before:from-static-white/[.12] before:to-transparent',
          'before:[mask-clip:content-box,border-box] before:[mask-composite:exclude] before:[mask-image:linear-gradient(#fff_0_0),linear-gradient(#fff_0_0)]',
          'after:absolute after:inset-0 after:rounded-[inherit] after:bg-gradient-to-b after:from-static-white after:to-transparent',
          'after:pointer-events-none after:opacity-[.16] after:transition after:duration-200 after:ease-out',
          'hover:after:opacity-[.24]',
        ],
      },
    },
  ],
  defaultVariants: { variant: 'neutral', size: 'medium' },
})

type FancyButtonSharedProps = VariantProps<typeof fancyButtonVariants>

type FancyButtonRootProps = VariantProps<typeof fancyButtonVariants> &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean
  }

const FancyButtonRoot = React.forwardRef<HTMLButtonElement, FancyButtonRootProps>(
  ({ asChild, children, variant, size, className, ...rest }, forwardedRef) => {
    const uniqueId = React.useId()
    const Component = asChild ? Slot : 'button'
    const { root } = fancyButtonVariants({ variant, size })
    const sharedProps: FancyButtonSharedProps = { variant, size }
    const extendedChildren = recursiveCloneChildren(
      children as React.ReactElement[],
      sharedProps,
      [FANCY_BUTTON_ICON_NAME],
      uniqueId,
      asChild,
    )
    return (
      <Component ref={forwardedRef} className={root({ class: className })} {...rest}>
        {extendedChildren}
      </Component>
    )
  },
)
FancyButtonRoot.displayName = FANCY_BUTTON_ROOT_NAME

function FancyButtonIcon<T extends React.ElementType>({
  className, variant, size, as, ...rest
}: PolymorphicComponentProps<T, FancyButtonSharedProps>) {
  const Component = as || 'div'
  const { icon } = fancyButtonVariants({ variant, size })
  return <Component className={icon({ class: className })} {...rest} />
}
FancyButtonIcon.displayName = FANCY_BUTTON_ICON_NAME

export { FancyButtonRoot as Root, FancyButtonIcon as Icon }

// Convenience default export for plain `<FancyButton variant="primary">Text</FancyButton>` usage.
const FancyButton = FancyButtonRoot
export { FancyButton }
