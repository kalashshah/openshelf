// Confirmation dialog built on the AlignUI Modal primitive (Radix Dialog).

'use client';

import { Button } from '@/components/ui/button';
import * as Modal from '@/components/ui/modal';

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  /** Disables both actions while the confirmed work is in flight. */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal.Root
      open={open}
      onOpenChange={(next) => {
        // Esc and click-away both cancel — but not while the action is running,
        // or the dialog would vanish with the outcome still unknown.
        if (!next && !busy) onCancel();
      }}
    >
      <Modal.Content>
        <Modal.Header showCloseButton={false}>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Modal.Description>{description}</Modal.Description>
        </Modal.Body>
        <Modal.Footer>
          {/* Cancel takes focus: the destructive action should never be one
              stray Enter away. */}
          <Button variant="secondary" onClick={onCancel} disabled={busy} autoFocus>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}
