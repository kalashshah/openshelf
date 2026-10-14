import { SearchX } from 'lucide-react';
import { Centered } from '@/components/common/centered';
import { FancyButton } from '@/components/ui/fancy-button';

export default function NotFound() {
  return (
    <Centered
      icon={<SearchX className="size-5 text-text-sub-600" />}
      title="Nothing on this shelf"
      actions={
        <FancyButton asChild variant="basic">
          <a href="/">Go home</a>
        </FancyButton>
      }
    >
      There is no store or product at this address.
    </Centered>
  );
}
