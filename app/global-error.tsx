'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-text-primary mb-4">Something went wrong</h2>
            <p className="text-text-secondary mb-8">{error.message}</p>
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
