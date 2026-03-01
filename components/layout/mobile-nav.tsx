'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './sidebar';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-md bg-bg-secondary border border-border-default hover:bg-bg-hover transition-colors"
      >
        <Menu className="h-5 w-5 text-text-primary" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="fixed left-0 top-0 z-50 lg:hidden"
            >
              <Sidebar />
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 p-1 rounded-md hover:bg-bg-hover transition-colors"
              >
                <X className="h-4 w-4 text-text-secondary" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
