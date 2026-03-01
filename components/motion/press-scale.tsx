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
      whileTap={{ scale }}
      transition={{ duration: 0.1 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
