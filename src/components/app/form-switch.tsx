'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';

/** AlignUI's Switch inside a plain form: a hidden input carries the value. */
export function FormSwitch({ name, defaultChecked, disabled, id }: { name: string; defaultChecked?: boolean; disabled?: boolean; id?: string }) {
  const [on, setOn] = useState(Boolean(defaultChecked));
  return (
    <>
      <Switch id={id} checked={on} onCheckedChange={setOn} disabled={disabled} />
      {on && <input type="hidden" name={name} value="on" />}
    </>
  );
}
