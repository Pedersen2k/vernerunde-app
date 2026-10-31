import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  back?: string
  actions?: ReactNode
}

export function Header({ title, subtitle, back, actions }: Props) {
  return (
    <header className="topbar">
      {back !== undefined && (
        <a className="icon-btn" href={`#${back}`} aria-label="Tilbake">
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      )}
      <div className="topbar-title">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="topbar-actions">{actions}</div>}
    </header>
  )
}
