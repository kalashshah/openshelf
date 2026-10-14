// AlignUI Select v0.0.0: Radix Select styled to the AlignUI trigger/menu contract,
// matching the vendored Dropdown and Modal in this directory.

'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

import type { PolymorphicComponentProps } from '@/lib/polymorphic';
import { tv, type VariantProps } from '@/lib/tv';

/**
 * A listbox rather than a native `<select>`.
 *
 * The native control was here first and it did carry platform keyboard and mobile
 * behaviour for free — but it can only hold text. Every select this app wants now
 * shows something beside the label: a brand logo for a model provider, a tick on
 * the current row, a hint under the name. That is not stylable inside an
 * `<option>` on any browser, so the listbox is the only way to draw it.
 *
 * Radix keeps what the native control gave us: typeahead, arrow keys, Home/End,
 * focus return, and a real `aria-activedescendant` for screen readers.
 */
export const selectVariants = tv({
  slots: {
    trigger: [
      'group/trigger flex w-full items-center gap-2 bg-bg-white-0 text-left text-text-strong-950',
      'shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 outline-none',
      'transition duration-200 ease-out',
      'hover:bg-bg-weak-50 hover:shadow-none hover:ring-transparent',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-base',
      'data-[state=open]:ring-2 data-[state=open]:ring-primary-base',
      'data-[placeholder]:text-text-soft-400',
      'disabled:pointer-events-none disabled:bg-bg-weak-50 disabled:text-text-disabled-300 disabled:shadow-none disabled:ring-transparent',
    ],
    icon: 'size-5 shrink-0 text-text-soft-400 transition-colors group-disabled/trigger:text-text-disabled-300',
    value: 'min-w-0 flex-1 truncate',
    chevron: [
      'size-5 shrink-0 text-text-sub-600 transition-transform duration-200 ease-out',
      'group-data-[state=open]/trigger:-rotate-180',
      'group-disabled/trigger:text-text-disabled-300',
    ],
  },
  variants: {
    size: {
      medium: { trigger: 'h-10 rounded-10 px-3 text-paragraph-sm' },
      small: { trigger: 'h-9 rounded-lg px-2.5 text-paragraph-sm' },
      xsmall: { trigger: 'h-8 rounded-lg px-2 text-paragraph-xs', icon: 'size-4', chevron: 'size-4' },
    },
    /** Naked trigger for a select that sits inside other chrome — a toolbar, a table cell. */
    variant: {
      default: {},
      inline: {
        trigger: [
          'h-auto w-auto gap-1 rounded-md px-0 text-label-sm shadow-none ring-transparent',
          'hover:bg-transparent hover:text-text-sub-600',
          'data-[state=open]:ring-transparent',
        ],
        chevron: 'size-4',
      },
    },
  },
  defaultVariants: { size: 'medium', variant: 'default' },
});

type SharedProps = VariantProps<typeof selectVariants>;

const SelectSharedContext = React.createContext<SharedProps>({});

const SelectRoot = ({
  size,
  variant,
  children,
  ...rest
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root> & SharedProps) => (
  <SelectSharedContext.Provider value={React.useMemo(() => ({ size, variant }), [size, variant])}>
    <SelectPrimitive.Root {...rest}>{children}</SelectPrimitive.Root>
  </SelectSharedContext.Provider>
);
SelectRoot.displayName = 'SelectRoot';

const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & SharedProps
>(({ className, children, size, variant, ...rest }, forwardedRef) => {
  const shared = React.useContext(SelectSharedContext);
  const styles = selectVariants({ size: size ?? shared.size, variant: variant ?? shared.variant });

  return (
    <SelectPrimitive.Trigger
      ref={forwardedRef}
      className={styles.trigger({ class: className })}
      {...rest}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className={styles.chevron()} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

/** Leading icon in the trigger — a brand mark, or anything that names the value's kind. */
function SelectTriggerIcon<T extends React.ElementType = 'div'>({
  className,
  as,
  ...rest
}: PolymorphicComponentProps<T>) {
  const Component = as || 'div';
  const shared = React.useContext(SelectSharedContext);
  const styles = selectVariants({ size: shared.size, variant: shared.variant });
  return <Component className={styles.icon({ class: className })} {...rest} />;
}
SelectTriggerIcon.displayName = 'SelectTriggerIcon';

const SelectValue = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Value>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>
>(({ className, ...rest }, forwardedRef) => {
  const shared = React.useContext(SelectSharedContext);
  const styles = selectVariants({ size: shared.size, variant: shared.variant });
  // Radix's Value drops className, so the layout lives on a wrapper.
  return (
    <span className={styles.value({ class: className })}>
      <SelectPrimitive.Value ref={forwardedRef} {...rest} />
    </span>
  );
});
SelectValue.displayName = 'SelectValue';

const SelectContent = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, position = 'popper', sideOffset = 8, children, ...rest }, forwardedRef) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={forwardedRef}
      position={position}
      sideOffset={sideOffset}
      className={[
        'relative z-50 flex flex-col overflow-hidden rounded-2xl bg-bg-white-0 p-2 shadow-regular-md ring-1 ring-inset ring-stroke-soft-200',
        // At least the trigger's width so the menu reads as the field opening
        // rather than as a popover that happens to be nearby. Capped in height
        // so a long list scrolls inside the menu instead of off the screen.
        'max-h-[min(var(--radix-select-content-available-height),20rem)] min-w-(--radix-select-trigger-width)',
        'data-[side=bottom]:origin-top data-[side=top]:origin-bottom',
        'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {/* Radix hides the viewport's scrollbar, so these are the visible cue. */}
      <SelectPrimitive.ScrollUpButton className="flex justify-center py-1 text-text-soft-400">
        <ChevronUp className="size-4" aria-hidden />
      </SelectPrimitive.ScrollUpButton>
      <SelectPrimitive.Viewport className="flex flex-col gap-1">{children}</SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="flex justify-center py-1 text-text-soft-400">
        <ChevronDown className="size-4" aria-hidden />
      </SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = 'SelectContent';

const SelectItem = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...rest }, forwardedRef) => (
  <SelectPrimitive.Item
    ref={forwardedRef}
    className={[
      'group/item relative flex cursor-pointer select-none items-center gap-2 rounded-lg p-2 pr-8',
      'text-paragraph-sm text-text-strong-950 outline-none transition duration-200 ease-out',
      'data-[highlighted]:bg-bg-weak-50',
      'data-[disabled]:pointer-events-none data-[disabled]:text-text-disabled-300',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...rest}
  >
    {/* The trigger shows only what is inside ItemText, so a plain-text row needs one. */}
    {typeof children === 'string' || typeof children === 'number' ? (
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    ) : (
      children
    )}
    <SelectPrimitive.ItemIndicator className="absolute right-2 flex items-center">
      <Check className="size-4 text-primary-base" aria-hidden />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';

/** Leading icon in a row. Sits at the text's size so rows with and without one still line up. */
function SelectItemIcon<T extends React.ElementType = 'div'>({
  className,
  as,
  ...rest
}: PolymorphicComponentProps<T>) {
  const Component = as || 'div';
  return (
    <Component
      className={[
        'size-5 shrink-0 text-text-sub-600 group-data-[disabled]/item:text-text-disabled-300',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    />
  );
}
SelectItemIcon.displayName = 'SelectItemIcon';

const SelectItemText = SelectPrimitive.ItemText;

const SelectGroup = SelectPrimitive.Group;

const SelectLabel = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...rest }, forwardedRef) => (
  <SelectPrimitive.Label
    ref={forwardedRef}
    className={['px-2 py-1 text-subheading-xs uppercase text-text-soft-400', className]
      .filter(Boolean)
      .join(' ')}
    {...rest}
  />
));
SelectLabel.displayName = 'SelectLabel';

const SelectSeparator = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...rest }, forwardedRef) => (
  <SelectPrimitive.Separator
    ref={forwardedRef}
    className={['-mx-2 my-1 h-px bg-stroke-soft-200', className].filter(Boolean).join(' ')}
    {...rest}
  />
));
SelectSeparator.displayName = 'SelectSeparator';

export {
  SelectRoot as Root,
  SelectTrigger as Trigger,
  SelectTriggerIcon as TriggerIcon,
  SelectValue as Value,
  SelectContent as Content,
  SelectItem as Item,
  SelectItemIcon as ItemIcon,
  SelectItemText as ItemText,
  SelectGroup as Group,
  SelectLabel as Label,
  SelectSeparator as Separator,
};
