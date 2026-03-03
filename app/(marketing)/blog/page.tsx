import { PageHero } from '@/components/landing/page-hero';
import { ContentSection } from '@/components/landing/content-section';
import { BlogPostCard } from '@/components/landing/blog-post-card';
import { getAllPosts } from '@/lib/blog';

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <>
      <PageHero badge="Blog" title="Insights for growing agencies" subtitle="Tips, strategies, and updates from the Agency OS team." />

      <ContentSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <BlogPostCard
              key={post.slug}
              slug={post.slug}
              title={post.title}
              excerpt={post.excerpt}
              date={post.date}
              readTime={post.readTime}
              author={post.author}
            />
          ))}
        </div>
      </ContentSection>
    </>
  );
}
