import type { ReactNode } from 'react';

export function Card({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      <div className={title || subtitle ? 'mt-3' : undefined}>{children}</div>
    </section>
  );
}
