import type { ReactNode } from 'react'
import { Icon } from './Icon'

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
        <a className="icon-btn back" href={`#${back}`} aria-label="Tilbake">
          <Icon name="back" size={24} />
        </a>
      )}
      <div className="topbar-title">
        {subtitle && <p>{subtitle}</p>}
        <h1>{title}</h1>
      </div>
      {actions && <div className="topbar-actions">{actions}</div>}
    </header>
  )
}
