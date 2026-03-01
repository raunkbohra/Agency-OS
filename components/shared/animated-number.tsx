'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: 'currency' | 'percentage' | 'integer';
  prefix?: string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 1,
  format = 'integer',
  prefix = '',
  className,
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
    });

    const unsubscribe = motionValue.on('change', (latest) => {
      if (ref.current) {
        let formatted: string;
        if (format === 'currency') {
          formatted = prefix + latest.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        } else if (format === 'percentage') {
          formatted = latest.toFixed(1) + '%';
        } else {
          formatted = Math.round(latest).toLocaleString();
        }
        ref.current.textContent = formatted;
      }
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, duration, format, prefix, motionValue]);

  return <span ref={ref} className={className}>0</span>;
}
