import { PageHero } from '@/components/landing/page-hero';
import { ContentSection } from '@/components/landing/content-section';
import { getAllPosts, getPostBySlug } from '@/lib/blog';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import { MarkdownContent } from '@/components/markdown-content';

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map(post => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return (
      <ContentSection>
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h1 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Post not found</h1>
          <Link href="/blog" style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>
            Back to blog
          </Link>
        </div>
      </ContentSection>
    );
  }

  return (
    <>
      <PageHero badge="Blog" title={post.title} subtitle={post.excerpt} />

      <ContentSection>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--border-default)' }}>
            <Link
              href="/blog"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--accent-blue)',
                textDecoration: 'none',
                marginBottom: '1.5rem',
              }}
            >
              <ArrowLeft size={16} /> Back to blog
            </Link>

            <div
              style={{
                display: 'flex',
                gap: '2rem',
                flexWrap: 'wrap',
                color: 'var(--text-tertiary)',
                fontSize: '0.875rem',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={14} /> {post.author}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={14} /> {post.date}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={14} /> {post.readTime}
              </span>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <MarkdownContent content={post.content} />
          </div>
        </div>
      </ContentSection>
    </>
  );
}
