import type { ComponentProps, ReactNode } from 'react'

// oxlint-disable-next-line react/only-export-components
export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx('rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-cardDark dark:shadow-none', className)}>
      {children}
    </div>
  )
}

type Variant = 'primary' | 'danger' | 'secondary' | 'ghost' | 'success'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-orange-600 text-white shadow-lg shadow-orange-600/25 hover:bg-orange-500',
  danger: 'bg-red-600 text-white shadow-lg shadow-red-600/25 hover:bg-red-500',
  success:
    'border border-emerald-600/40 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20',
  secondary:
    'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-600/60 dark:bg-slate-700/50 dark:text-slate-100 dark:hover:bg-slate-700',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/60',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  block,
  className,
  ...rest
}: ComponentProps<'button'> & { variant?: Variant; size?: 'sm' | 'md' | 'lg'; block?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100',
        size === 'sm' && 'min-h-9 px-3 text-sm',
        size === 'md' && 'min-h-11 px-4 text-[0.95rem]',
        size === 'lg' && 'min-h-14 px-5 text-base',
        block && 'w-full',
        VARIANTS[variant],
        className,
      )}
    />
  )
}

export function LinkButton({
  href,
  variant = 'secondary',
  size = 'md',
  block,
  className,
  children,
}: {
  href: string
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <a
      href={href}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold no-underline transition active:scale-[0.98]',
        size === 'sm' && 'min-h-9 px-3 text-sm',
        size === 'md' && 'min-h-11 px-4 text-[0.95rem]',
        size === 'lg' && 'min-h-14 px-5 text-base',
        block && 'w-full',
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </a>
  )
}

// oxlint-disable-next-line react/only-export-components
export const inputClass =
  'w-full min-h-12 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[0.95rem] text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:border-slate-600/70 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500'

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between text-sm font-semibold text-slate-600 dark:text-slate-300">
        {label}
        {hint}
      </span>
      {children}
    </label>
  )
}

export function SectionTitle({ icon, children, action }: { icon?: ReactNode; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mt-2 flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-[0.95rem] font-bold text-slate-900 dark:text-white">
        {icon}
        {children}
      </h2>
      {action}
    </div>
  )
}

export function Pill({ tone, children, className }: { tone: 'red' | 'amber' | 'green' | 'orange' | 'slate'; children: ReactNode; className?: string }) {
  const tones = {
    red: 'border-red-300 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400',
    amber: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400',
    green: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-400',
    orange: 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-400',
    slate: 'border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-700/40 dark:text-slate-300',
  }
  return <span className={cx('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold', tones[tone], className)}>{children}</span>
}

export function Empty({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
      <div className="text-slate-400 dark:text-slate-500">{icon}</div>
      <p className="font-semibold text-slate-800 dark:text-slate-200">{title}</p>
      {children && <div className="text-sm">{children}</div>}
    </div>
  )
}
