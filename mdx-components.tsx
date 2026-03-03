import type { MDXComponents } from 'mdx/types';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mt-8 mb-4">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mt-7 mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 mt-6 mb-3">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="text-base leading-7 text-slate-700 dark:text-slate-300 mb-4">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="space-y-2 mb-4 list-disc list-inside text-slate-700 dark:text-slate-300">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="space-y-2 mb-4 list-decimal list-inside text-slate-700 dark:text-slate-300">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="text-base leading-7">
        {children}
      </li>
    ),
    a: ({ children, href }) => (
      <a
        href={href}
        className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
      >
        {children}
      </a>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-slate-900 dark:text-slate-50">
        {children}
      </strong>
    ),
    hr: () => (
      <hr className="my-6 border-t border-slate-200 dark:border-slate-800" />
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-600 dark:border-blue-400 pl-4 py-2 my-4 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 italic">
        {children}
      </blockquote>
    ),
    ...components,
  };
}
