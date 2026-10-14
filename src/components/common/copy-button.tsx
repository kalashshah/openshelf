'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { FancyButton } from '@/components/ui/fancy-button';

export function CopyButton({ text, variant = 'basic' }: { text: string; variant?: 'basic' | 'neutral' }) {
  const [copied, setCopied] = useState(false);
  return (
    <FancyButton
      type="button"
      variant={variant}
      size="xsmall"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? 'Copied' : 'Copy'}
    </FancyButton>
  );
}
