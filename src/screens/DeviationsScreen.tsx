import { CheckCircle, Plus, Warning } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { AppShell, openQuickFinding } from '../components/AppShell'
import { DeviationCard } from '../components/DeviationCard'
import { cx, Empty } from '../components/ui'
import { db } from '../db'
import { collectDeviations, isOverdue } from '../lib/deviations'

const SEV_ORDER = { kritisk: 0, middels: 1, lav: 2 }

export function DeviationsScreen() {
  const rounds = useLiveQuery(() => db.rounds.toArray(), [])
  const [tab, setTab] = useState<'open' | 'done'>('open')
  const [now] = useState(() => Date.now())
  const all = rounds ? collectDeviations(rounds) : []
  const open = all
    .filter((d) => d.deviation.resolvedAt === null)
    .sort((a, b) => a.deviation.due - b.deviation.due || SEV_ORDER[a.deviation.severity] - SEV_ORDER[b.deviation.severity])
  const done = all.filter((d) => d.deviation.resolvedAt !== null).sort((a, b) => b.deviation.resolvedAt! - a.deviation.resolvedAt!)
  const overdue = open.filter((d) => isOverdue(d.deviation, now)).length
  const list = tab === 'open' ? open : done

  return (
    <AppShell tab="avvik">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-orange-600 dark:text-orange-400">Tiltaksliste</p>
          <h1 className="font-display text-xl font-extrabold text-slate-900 dark:text-white">Åpne avvik og oppfølging</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{overdue > 0 ? `${overdue} avvik har passert fristen.` : 'Alle avvik samlet, med frist og ansvarlig.'}</p>
        </div>
        <button type="button" onClick={openQuickFinding} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-red-600 px-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/30 active:scale-95">
          <Plus size={18} weight="bold" /> Nytt avvik
        </button>
      </div>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-200/70 p-1 dark:bg-cardDark" role="tablist">
        {(
          [
            ['open', `Åpne (${open.length})`],
            ['done', `Utbedret (${done.length})`],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cx('min-h-10 rounded-lg text-sm font-bold transition', tab === k ? 'bg-white text-slate-900 shadow dark:bg-cardElevated dark:text-white' : 'text-slate-500 dark:text-slate-400')}
          >
            {label}
          </button>
        ))}
      </div>
      {rounds && list.length === 0 && (
        <Empty icon={tab === 'open' ? <CheckCircle size={32} /> : <Warning size={32} />} title={tab === 'open' ? 'Ingen åpne avvik' : 'Ingen utbedrede avvik ennå'}>
          {tab === 'open' ? 'Bra jobba! Nye avvik fra rundene havner her.' : 'Når et avvik er rettet, trykker du «Utbedret».'}
        </Empty>
      )}
      {list.map((d) => (
        <DeviationCard key={d.item.id} d={d} now={now} showPhotos />
      ))}
    </AppShell>
  )
}
