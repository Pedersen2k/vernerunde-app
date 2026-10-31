import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { deviationCounts } from '../lib/deviations'
import { Icon, type IconName } from './Icon'

type Tab = 'runder' | 'avvik' | 'maler' | 'innstillinger'

const TABS: { id: Tab; href: string; label: string; icon: IconName }[] = [
  { id: 'runder', href: '#/', label: 'Vernerunder', icon: 'list' },
  { id: 'avvik', href: '#/avvik', label: 'Avvik', icon: 'warning' },
  { id: 'maler', href: '#/maler', label: 'Sjekklister', icon: 'clipboard' },
  { id: 'innstillinger', href: '#/innstillinger', label: 'Firma', icon: 'building' },
]

export function BottomNav({ active }: { active: Tab }) {
  const counts = useLiveQuery(async () => deviationCounts(await db.rounds.toArray()), [])
  return (
    <nav className="bottomnav" aria-label="Hovedmeny">
      {TABS.map((t) => (
        <a key={t.id} href={t.href} className={active === t.id ? 'active' : ''} aria-current={active === t.id ? 'page' : undefined}>
          <span className="nav-icon">
            <Icon name={t.icon} size={22} />
            {t.id === 'avvik' && counts && counts.open > 0 && (
              <span className={`nav-badge ${counts.overdue > 0 ? 'late' : ''}`}>{counts.open}</span>
            )}
          </span>
          {t.label}
        </a>
      ))}
    </nav>
  )
}
