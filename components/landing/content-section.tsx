interface ContentSectionProps {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}

export function ContentSection({ children, className = '', narrow = false }: ContentSectionProps) {
  return (
    <section className={`px-6 pb-20 ${className}`}>
      <div className={`mx-auto ${narrow ? 'max-w-3xl' : 'max-w-4xl'}`}>
        {children}
      </div>
    </section>
  );
}
