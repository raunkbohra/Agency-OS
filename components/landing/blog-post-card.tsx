import Link from 'next/link';
import { Calendar, Clock } from 'lucide-react';

interface BlogPostCardProps {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  author: string;
}

export function BlogPostCard({ slug, title, excerpt, date, readTime, author }: BlogPostCardProps) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="block rounded-xl p-6 transition-all duration-200 group"
      style={{
        background: 'var(--landing-card-bg)',
        border: '1px solid var(--landing-card-border)',
      }}
    >
      <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--accent-blue)' }}>
        {author}
      </p>
      <h3
        className="text-lg font-semibold mb-2 transition-colors"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h3>
      <p className="text-sm leading-relaxed mb-4 line-clamp-3" style={{ color: 'var(--text-tertiary)' }}>
        {excerpt}
      </p>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-quaternary)' }}>
          <Calendar size={12} />{date}
        </span>
        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-quaternary)' }}>
          <Clock size={12} />{readTime}
        </span>
      </div>
    </Link>
  );
}
