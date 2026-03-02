export default function MigratedPortalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-md text-center px-6">
        <div
          className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-6"
          style={{ background: 'var(--accent-blue)', color: 'white' }}
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Portal Updated
        </h1>
        <p className="mb-8 text-base" style={{ color: 'var(--text-secondary)' }}>
          Your client portal has been updated. You now need to log in with your email and password.
        </p>
        <a
          href="/client-portal/login"
          className="inline-block px-6 py-3 rounded-lg font-medium text-white transition-all"
          style={{ background: 'var(--accent-blue)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = 'brightness(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'brightness(1)';
          }}
        >
          Go to Login
        </a>
      </div>
    </div>
  );
}
