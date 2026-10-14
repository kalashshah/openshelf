'use client';

import { motion, MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

// Same curve as the meet-minds landing page.
const EASE = [0.21, 0.47, 0.32, 0.98] as const;

type Props = {
  className?: string;
  // Stagger offset in ms, applied once the element scrolls into view.
  delay?: number;
  children: ReactNode;
};

export function Reveal({ className, delay = 0, children }: Props) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className={className}
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, delay: delay / 1000, ease: EASE }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
