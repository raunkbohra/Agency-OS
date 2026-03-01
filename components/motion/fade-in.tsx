'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function FadeIn({ children, className, delay = 0, duration = 0.2, direction = 'up' }: FadeInProps) {
  const directionMap = {
    up: { y: 8 },
    down: { y: -8 },
    left: { x: 8 },
    right: { x: -8 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
