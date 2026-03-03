import type { MDXComponents } from 'mdx/types';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl sm:text-2xl font-semibold mt-10 mb-4" style={{ color: 'var(--text-primary)' }}>{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-medium mt-6 mb-2" style={{ color: 'var(--text-primary)' }}>{children}</h3>
    ),
    p: ({ children }) => (
      <p className="mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc pl-6 mb-4 space-y-1" style={{ color: 'var(--text-secondary)' }}>{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-6 mb-4 space-y-1" style={{ color: 'var(--text-secondary)' }}>{children}</ol>
    ),
    li: ({ children }) => (
      <li style={{ fontSize: '0.9375rem', lineHeight: '1.6' }}>{children}</li>
    ),
    a: ({ children, href }) => (
      <a href={href} className="underline underline-offset-2 transition-colors" style={{ color: 'var(--accent-blue)' }}>{children}</a>
    ),
    strong: ({ children }) => (
      <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{children}</strong>
    ),
    hr: () => (
      <hr className="my-8" style={{ borderColor: 'var(--landing-divider)' }} />
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 pl-4 my-4 italic" style={{ borderColor: 'var(--accent-blue)', color: 'var(--text-tertiary)' }}>{children}</blockquote>
    ),
    code: ({ children, className }) => (
      <code className={`px-1.5 py-0.5 rounded text-sm font-mono ${className || ''}`} style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--accent-blue)' }}>{children}</code>
    ),
    pre: ({ children }) => (
      <pre className="rounded-lg p-4 overflow-x-auto mb-4" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>{children}</pre>
    ),
    ...components,
  };
}
