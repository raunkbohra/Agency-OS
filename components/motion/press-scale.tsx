'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PressScaleProps {
  children: ReactNode;
  className?: string;
  scale?: number;
}

export function PressScale({ children, className, scale = 0.98 }: PressScaleProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
