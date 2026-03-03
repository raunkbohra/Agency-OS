'use client';

import Link from 'next/link';
import { Users, ClipboardList, CheckCircle, Plus, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface DeliverableEmptyStateProps {
  onCreateClick: () => void;
  hasFilter?: boolean;
  filterLabel?: string;
}

const steps = [
  {
    icon: Users,
    title: 'Add a Client',
    description: 'Start by adding your first client to the system.',
    href: '/dashboard/clients',
    color: 'text-accent-blue',
    bgColor: 'bg-accent-blue/10',
  },
  {
    icon: ClipboardList,
    title: 'Create a Plan',
    description: 'Set up a service plan with deliverables and pricing.',
    href: '/dashboard/plans',
    color: 'text-accent-amber',
    bgColor: 'bg-accent-amber/10',
  },
  {
    icon: CheckCircle,
    title: 'Track Deliverables',
    description: 'Monitor progress, review work, and keep clients updated.',
    href: null,
    color: 'text-accent-green',
    bgColor: 'bg-accent-green/10',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function DeliverableEmptyState({ onCreateClick, hasFilter, filterLabel }: DeliverableEmptyStateProps) {
  if (hasFilter) {
    return (
      <div className="text-center py-16 bg-bg-secondary rounded-xl border border-border-default">
        <div className="mx-auto w-12 h-12 rounded-full bg-bg-hover flex items-center justify-center mb-4">
          <ClipboardList className="h-5 w-5 text-text-tertiary" />
        </div>
        <p className="text-sm font-medium text-text-secondary">
          No deliverables {filterLabel ? `with status "${filterLabel}"` : 'matching your filters'}.
        </p>
        <p className="text-xs text-text-tertiary mt-1">Try adjusting your filters or search query.</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="py-12 sm:py-16"
    >
      <motion.div variants={item} className="text-center mb-10">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-accent-blue/10 flex items-center justify-center mb-4">
          <ClipboardList className="h-7 w-7 text-accent-blue" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary">No deliverables yet</h3>
        <p className="text-sm text-text-tertiary mt-1.5 max-w-md mx-auto">
          Get started in 3 simple steps to begin tracking your client work.
        </p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-10">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const content = (
            <div className="relative p-5 rounded-xl border border-border-default bg-bg-secondary hover:border-border-hover hover:bg-bg-hover transition-all group">
              <span className="absolute top-3 right-3 text-[10px] font-bold text-text-tertiary/50">
                {i + 1}
              </span>
              <div className={`w-10 h-10 rounded-xl ${step.bgColor} flex items-center justify-center mb-3`}>
                <Icon className={`h-5 w-5 ${step.color}`} />
              </div>
              <p className="text-sm font-semibold text-text-primary">{step.title}</p>
              <p className="text-xs text-text-tertiary mt-1 leading-relaxed">{step.description}</p>
              {step.href && (
                <div className="flex items-center gap-1 mt-3">
                  <span className={`text-xs font-medium ${step.color}`}>Get started</span>
                  <ArrowRight className={`h-3 w-3 ${step.color} group-hover:translate-x-0.5 transition-transform`} />
                </div>
              )}
            </div>
          );

          return step.href ? (
            <Link key={step.title} href={step.href}>
              {content}
            </Link>
          ) : (
            <div key={step.title}>{content}</div>
          );
        })}
      </motion.div>

      <motion.div variants={item} className="text-center">
        <button
          onClick={onCreateClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-accent-blue text-white hover:bg-accent-blue/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Create Your First Deliverable
        </button>
        <p className="text-xs text-text-tertiary mt-3">
          Or create a deliverable directly if you already have clients and plans set up.
        </p>
      </motion.div>
    </motion.div>
  );
}
