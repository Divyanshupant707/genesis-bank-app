import React, { useEffect } from 'react';

export function Button({ children, variant = 'brass', className = '', ...props }) {
  const variants = {
    brass:
      'bg-brass text-ink hover:bg-brass-light active:bg-brass-dark shadow-stamp',
    vault:
      'bg-vault text-paper hover:bg-vault-light border border-vault-light/40',
    ghost:
      'bg-transparent text-paper/80 hover:text-paper border border-paper/20 hover:border-paper/40',
    danger:
      'bg-transparent text-rust border border-rust/50 hover:bg-rust/10'
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2.5 font-body text-sm font-semibold tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, hint, error, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[11px] font-mono uppercase tracking-[0.15em] text-paper/50">
        {label}
      </span>
      <input
        className="w-full rounded-sm border border-paper/15 bg-ink-light/60 px-3 py-2.5 font-body text-paper placeholder:text-paper/30 focus:border-brass/60 focus:bg-ink-light"
        {...props}
      />
      {hint && !error && <span className="mt-1 block text-xs text-paper/40">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-rust">{error}</span>}
    </label>
  );
}

export function Select({ label, children, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[11px] font-mono uppercase tracking-[0.15em] text-paper/50">
        {label}
      </span>
      <select
        className="w-full rounded-sm border border-paper/15 bg-ink-light/60 px-3 py-2.5 font-body text-paper focus:border-brass/60 focus:bg-ink-light"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-md border border-paper/10 bg-ink-light/70 backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ eyebrow, title, subtitle }) {
  return (
    <div className="mb-5">
      {eyebrow && (
        <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.25em] text-brass/80">
          {eyebrow}
        </div>
      )}
      <h2 className="font-display text-2xl font-medium text-paper">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-paper/50">{subtitle}</p>}
    </div>
  );
}

export function StampBadge({ children, tone = 'brass' }) {
  const tones = {
    brass: 'border-brass/50 text-brass',
    vault: 'border-vault-light/60 text-vault-light',
    rust: 'border-rust/50 text-rust'
  };
  return <span className={`stamp-badge ${tones[tone]}`}>{children}</span>;
}

export function Spinner({ className = '' }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      width="18"
      height="18"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 4200);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;
  const isError = toast.type === 'error';
  return (
    <div className="pointer-events-none fixed inset-x-0 top-5 z-50 flex justify-center px-4">
      <div
        className={`animate-rise pointer-events-auto flex max-w-md items-start gap-3 rounded-sm border px-4 py-3 shadow-lg backdrop-blur ${
          isError
            ? 'border-rust/40 bg-ink/95 text-rust'
            : 'border-brass/40 bg-ink/95 text-paper'
        }`}
      >
        <span className="mt-0.5 font-mono text-xs">{isError ? '\u2716' : '\u2713'}</span>
        <p className="text-sm">{toast.message}</p>
      </div>
    </div>
  );
}
