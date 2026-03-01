'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

function makeSparkles(count: number): Sparkle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 4 + Math.random() * 92,
    y: 4 + Math.random() * 92,
    size: Math.random() < 0.12 ? 3 : Math.random() < 0.35 ? 2 : 1.5,
    delay: Math.random() * 3.5,
    duration: 1.0 + Math.random() * 2.0,
    opacity: 0.55 + Math.random() * 0.45,
  }));
}

function SparkleParticles({ count }: { count: number }) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  // Generate only on client to avoid hydration mismatch
  useEffect(() => {
    setSparkles(makeSparkles(count));
  }, [count]);

  return (
    <>
      {sparkles.map((s) => (
        <motion.span
          key={s.id}
          aria-hidden
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            borderRadius: '50%',
            background: s.size >= 3 ? '#ffffff' : '#c8e0f0',
            boxShadow: s.size >= 2 ? `0 0 ${s.size * 3}px rgba(200,230,248,0.9)` : 'none',
            pointerEvents: 'none',
          }}
          animate={{ opacity: [0, s.opacity, 0], scale: [0.2, 1, 0.2] }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </>
  );
}

const nightSkyStyle = {
  background: 'linear-gradient(135deg, #0b1520 0%, #172030 50%, #0f1c28 100%)',
  border: '1px solid rgba(160, 200, 230, 0.2)',
  boxShadow: '0 0 20px rgba(140, 190, 220, 0.12), 0 4px 24px rgba(0,0,0,0.55)',
  color: '#ddeef8',
} as const;

interface Props {
  href: string;
  children: React.ReactNode;
  className?: string;
  large?: boolean;
}

export function SparkleButton({ href, children, className = '', large = false }: Props) {
  const padding = large
    ? 'px-8 py-4 text-base rounded-2xl'
    : 'px-6 py-3 text-sm rounded-xl';

  return (
    <Link
      href={href}
      className={`relative overflow-hidden inline-flex items-center font-semibold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${padding} ${className}`}
      style={nightSkyStyle}
    >
      <SparkleParticles count={large ? 32 : 24} />
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </Link>
  );
}

export function SparkleButtonSm({ href, children, className = '' }: Omit<Props, 'large'>) {
  return (
    <Link
      href={href}
      className={`relative overflow-hidden inline-flex items-center font-semibold transition-all duration-200 hover:scale-[0.98] active:scale-95 px-4 py-2 text-sm rounded-xl ${className}`}
      style={nightSkyStyle}
    >
      <SparkleParticles count={16} />
      <span className="relative z-10">{children}</span>
    </Link>
  );
}
