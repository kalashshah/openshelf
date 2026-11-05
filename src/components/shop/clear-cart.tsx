'use client';

import { useEffect } from 'react';

/** After a paid order: empty that store's bag in this browser. */
export function ClearCart({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      localStorage.removeItem(`openshelf:cart:${slug}`);
    } catch {
      // Storage unavailable: nothing was saved either.
    }
  }, [slug]);
  return null;
}
