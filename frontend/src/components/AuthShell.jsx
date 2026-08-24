export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-md border-2 border-brand-dark text-brand-dark mb-3">
            <svg width="24" height="24" viewBox="0 0 30 30" fill="none" aria-hidden="true">
              <path d="M6 22V13L15 7L24 13V22" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M12 22V16H18V22" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
          <p className="text-sm font-body text-inkfaint mt-1">{subtitle}</p>
        </div>
        <div className="bg-card border border-line rounded-md p-6 shadow-pin">{children}</div>
        {footer && (
          <p className="text-center text-sm font-body text-inkfaint mt-5">{footer}</p>
        )}
      </div>
    </div>
  );
}
