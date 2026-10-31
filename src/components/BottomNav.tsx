import { Icon, type IconName } from './Icon'

type Tab = 'runder' | 'maler' | 'innstillinger'

const TABS: { id: Tab; href: string; label: string; icon: IconName }[] = [
  { id: 'runder', href: '#/', label: 'Vernerunder', icon: 'list' },
  { id: 'maler', href: '#/maler', label: 'Sjekklister', icon: 'clipboard' },
  { id: 'innstillinger', href: '#/innstillinger', label: 'Firma', icon: 'building' },
]

export function BottomNav({ active }: { active: Tab }) {
  return (
    <nav className="bottomnav" aria-label="Hovedmeny">
      {TABS.map((t) => (
        <a key={t.id} href={t.href} className={active === t.id ? 'active' : ''} aria-current={active === t.id ? 'page' : undefined}>
          <span className="nav-icon">
            <Icon name={t.icon} size={22} />
          </span>
          {t.label}
        </a>
      ))}
    </nav>
  )
}
