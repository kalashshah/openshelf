// AlignUI Modal v0.0.0: vendored from the meet-minds/aseo-seo projects,
// modelled on the centered Radix Dialog pattern. Use for short confirmation
// / explanation dialogs.

'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ModalRoot = DialogPrimitive.Root;
ModalRoot.displayName = 'Modal';

const ModalTrigger = DialogPrimitive.Trigger;
ModalTrigger.displayName = 'ModalTrigger';

const ModalClose = DialogPrimitive.Close;
ModalClose.displayName = 'ModalClose';

const ModalPortal = DialogPrimitive.Portal;
ModalPortal.displayName = 'ModalPortal';

const ModalOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...rest }, forwardedRef) => {
  return (
    <DialogPrimitive.Overlay
      ref={forwardedRef}
      className={cn(
        'fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-overlay p-4 backdrop-blur-[10px]',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className,
      )}
      {...rest}
    />
  );
});
ModalOverlay.displayName = 'ModalOverlay';

const ModalContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...rest }, forwardedRef) => {
  return (
    <ModalPortal>
      <ModalOverlay>
        <DialogPrimitive.Content
          ref={forwardedRef}
          className={cn(
            'w-full max-w-md rounded-2xl bg-bg-white-0 shadow-fancy-buttons-stroke',
            'data-[state=open]:duration-150 data-[state=open]:ease-out data-[state=open]:animate-in',
            'data-[state=closed]:duration-150 data-[state=closed]:ease-in data-[state=closed]:animate-out',
            'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
            className,
          )}
          {...rest}
        >
          <div className="relative flex flex-col">{children}</div>
        </DialogPrimitive.Content>
      </ModalOverlay>
    </ModalPortal>
  );
});
ModalContent.displayName = 'ModalContent';

function ModalHeader({
  className,
  children,
  showCloseButton = true,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { showCloseButton?: boolean }) {
  return (
    <div className={cn('flex items-center gap-3 px-5 pb-3 pt-5', className)} {...rest}>
      {children}
      {showCloseButton && (
        <ModalClose asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Close">
            <X className="size-5" />
          </Button>
        </ModalClose>
      )}
    </div>
  );
}
ModalHeader.displayName = 'ModalHeader';

const ModalTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...rest }, forwardedRef) => {
  return (
    <DialogPrimitive.Title
      ref={forwardedRef}
      className={cn('flex-1 text-label-lg text-text-strong-950', className)}
      {...rest}
    />
  );
});
ModalTitle.displayName = 'ModalTitle';

const ModalDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...rest }, forwardedRef) => {
  return (
    <DialogPrimitive.Description
      ref={forwardedRef}
      className={cn('text-paragraph-sm text-text-sub-600', className)}
      {...rest}
    />
  );
});
ModalDescription.displayName = 'ModalDescription';

function ModalBody({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('space-y-2 px-5 pb-3', className)} {...rest}>
      {children}
    </div>
  );
}
ModalBody.displayName = 'ModalBody';

function ModalFooter({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center justify-end gap-2 px-5 pb-5 pt-2', className)} {...rest} />;
}
ModalFooter.displayName = 'ModalFooter';

// Native AlignUI namespaced exports
export {
  ModalRoot as Root,
  ModalTrigger as Trigger,
  ModalClose as Close,
  ModalContent as Content,
  ModalHeader as Header,
  ModalTitle as Title,
  ModalDescription as Description,
  ModalBody as Body,
  ModalFooter as Footer,
};

// Shadcn-shaped aliases for consumer compat
export { ModalRoot as Modal, ModalTrigger, ModalClose, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter };
export { ModalBody };
