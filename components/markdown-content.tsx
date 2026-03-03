'use client';

import { useMemo } from 'react';

interface MarkdownContentProps {
  content: string;
}

/**
 * Simple markdown to React components converter.
 * This safely renders markdown without HTML parsing vulnerabilities.
 */
export function MarkdownContent({ content }: MarkdownContentProps) {
  const elements = useMemo(() => {
    const lines = content.split('\n');
    const result: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // H1 headings
      if (trimmed.startsWith('# ')) {
        result.push(
          <h1 key={`h1-${i}`} className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            {trimmed.slice(2)}
          </h1>
        );
        i++;
        // Add spacing after heading
        if (i < lines.length && lines[i].trim() === '') {
          i++;
        }
      }

      // H2 headings
      else if (trimmed.startsWith('## ')) {
        result.push(
          <h2 key={`h2-${i}`} className="text-xl sm:text-2xl font-semibold mt-10 mb-4" style={{ color: 'var(--text-primary)' }}>
            {trimmed.slice(3)}
          </h2>
        );
        i++;
        // Add spacing after heading
        if (i < lines.length && lines[i].trim() === '') {
          i++;
        }
      }

      // H3 headings
      else if (trimmed.startsWith('### ')) {
        result.push(
          <h3 key={`h3-${i}`} className="text-lg font-medium mt-6 mb-2" style={{ color: 'var(--text-primary)' }}>
            {trimmed.slice(4)}
          </h3>
        );
        i++;
        // Add spacing after heading
        if (i < lines.length && lines[i].trim() === '') {
          i++;
        }
      }

      // Unordered lists
      else if (trimmed.startsWith('- ')) {
        const listItems = [];
        while (i < lines.length && lines[i].trim().startsWith('- ')) {
          listItems.push(
            <li key={`li-${i}`} style={{ fontSize: '0.9375rem', lineHeight: '1.6' }}>
              {lines[i].trim().slice(2)}
            </li>
          );
          i++;
        }
        result.push(
          <ul key={`ul-${i}`} className="list-disc pl-6 mb-4 space-y-1" style={{ color: 'var(--text-secondary)' }}>
            {listItems}
          </ul>
        );
      }

      // Ordered lists
      else if (/^\d+\. /.test(trimmed)) {
        const listItems = [];
        while (i < lines.length && /^\d+\. /.test(lines[i].trim())) {
          const match = lines[i].trim().match(/^\d+\. (.*)$/);
          listItems.push(
            <li key={`ol-li-${i}`} style={{ fontSize: '0.9375rem', lineHeight: '1.6' }}>
              {match ? match[1] : ''}
            </li>
          );
          i++;
        }
        result.push(
          <ol key={`ol-${i}`} className="list-decimal pl-6 mb-4 space-y-1" style={{ color: 'var(--text-secondary)' }}>
            {listItems}
          </ol>
        );
      }

      // Empty lines
      else if (trimmed === '') {
        result.push(<div key={`empty-${i}`} style={{ height: '1rem' }} />);
        i++;
      }

      // Regular paragraphs
      else {
        // Collect consecutive non-empty lines as one paragraph
        const paragraph = [];
        while (i < lines.length && lines[i].trim() !== '' && !lines[i].trim().startsWith('#') && !lines[i].trim().startsWith('- ') && !/^\d+\. /.test(lines[i].trim())) {
          paragraph.push(lines[i].trim());
          i++;
        }

        if (paragraph.length > 0) {
          const text = paragraph.join(' ');
          result.push(
            <p key={`p-${i}`} className="mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
              {text}
            </p>
          );
        }
      }
    }

    return result;
  }, [content]);

  return <>{elements}</>;
}
