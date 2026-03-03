import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  readTime: string;
  tags: string[];
  content: string;
}

const BLOG_DIR = path.join(process.cwd(), 'content/blog');

export function getAllPosts(): BlogPost[] {
  const files = fs.readdirSync(BLOG_DIR).filter(file => file.endsWith('.mdx'));

  const posts = files.map(file => {
    const filePath = path.join(BLOG_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    return {
      slug: file.replace('.mdx', ''),
      title: data.title,
      excerpt: data.excerpt,
      date: data.date,
      author: data.author,
      readTime: data.readTime,
      tags: data.tags || [],
      content,
    };
  });

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | null {
  try {
    const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    return {
      slug,
      title: data.title,
      excerpt: data.excerpt,
      date: data.date,
      author: data.author,
      readTime: data.readTime,
      tags: data.tags || [],
      content,
    };
  } catch {
    return null;
  }
}
