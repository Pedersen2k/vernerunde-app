import { CaretRight, CheckCircle, ClipboardText, Crown, Lightning, PlayCircle, WarningCircle } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { AppShell } from '../components/AppShell'
import { DeviationCard } from '../components/DeviationCard'
import { Button, Card, cx, Empty, SectionTitle } from '../components/ui'
import { db } from '../db'
import { collectDeviations, isOverdue } from '../lib/deviations'
import { formatDate } from '../lib/format'
import { go } from '../lib/router'
import { roundStats, startRound } from '../lib/rounds'
import { useSettings } from '../lib/settings'
import { TEMPLATE_EMOJI } from '../lib/templates'

function StatTile({ label, value, sub, tone, href }: { label: string; value: string | number; sub: string; tone: 'red' | 'amber' | 'green'; href?: string }) {
  const colors = {
    red: { dot: 'bg-red-500', text: 'text-red-600 dark:text-red-500' },
    amber: { dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
    green: { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-500' },
  }[tone]
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</span>
        <span className={cx('h-2 w-2 rounded-full', colors.dot)} />
      </div>
      <span className={cx('text-[1.7rem] font-extrabold leading-none tabular-nums', colors.text)}>{value}</span>
      <span className="text-[0.7rem] text-slate-500 dark:text-slate-400">{sub}</span>
    </>
  )
  const cls =
    'flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 no-underline shadow-sm dark:border-slate-700/60 dark:bg-slate-800/60 dark:shadow-none'
  return href ? (
    <a href={href} className={cx(cls, 'transition hover:border-slate-300 dark:hover:border-slate-600')}>
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  )
}

export function Overview() {
  const settings = useSettings()
  const templates = useLiveQuery(() => db.templates.orderBy('updatedAt').reverse().toArray(), [])
  const rounds = useLiveQuery(() => db.rounds.orderBy('startedAt').reverse().toArray(), [])
  const [templateId, setTemplateId] = useState('')
  const [now] = useState(() => Date.now())

  const active = rounds?.find((r) => !r.finishedAt && r.templateId)
  const finished = rounds?.filter((r) => r.finishedAt && r.templateId) ?? []
  const lastScore = finished[0] ? roundStats(finished[0].areas).score : null
  const devs = rounds ? collectDeviations(rounds) : []
  const open = devs
    .filter((d) => d.deviation.resolvedAt === null)
    .sort((a, b) => a.deviation.due - b.deviation.due)
  const overdue = open.filter((d) => isOverdue(d.deviation, now)).length
  const selected = templates?.find((t) => t.id === templateId) ?? templates?.[0]
  const pointCount = selected?.areas.reduce((n, a) => n + a.checkpoints.length, 0) ?? 0

  const start = async () => {
    if (!selected) return
    await startRound(selected, {
      location: settings?.department ?? '',
      participants: settings?.inspectorName ? `${settings.inspectorName} (verneombud)` : '',
    })
    go('/runde')
  }

  const activeStats = active ? roundStats(active.areas) : null

  return (
    <AppShell tab="oversikt">
      <div className="grid grid-cols-3 gap-2.5">
        <StatTile label="Åpne avvik" value={open.length} sub="Krever tiltak" tone="red" href="#/avvik" />
        <StatTile label="Forfalt" value={overdue} sub="Over tidsfrist" tone="amber" href="#/avvik" />
        <StatTile label="Siste runde" value={lastScore === null ? '–' : `${lastScore}%`} sub={lastScore === null ? 'Ingen ennå' : 'Godkjent'} tone="green" />
      </div>

      {active && activeStats ? (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-xl ring-1 ring-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-orange-500/15 px-2.5 py-1 text-xs font-bold text-orange-400">
              <Lightning size={14} weight="fill" /> Pågående runde
            </span>
            <span className="text-xs text-slate-400">
              {activeStats.checked} av {activeStats.total} punkter
            </span>
          </div>
          <h2 className="mt-3 text-xl font-bold">{active.title}</h2>
          <p className="mt-1 text-sm text-slate-400">{[active.location, formatDate(active.startedAt)].filter(Boolean).join(' · ')}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-700">
            <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${activeStats.total ? (activeStats.checked / activeStats.total) * 100 : 0}%` }} />
          </div>
          <Button variant="primary" size="lg" block className="mt-5" onClick={() => go('/runde')}>
            <PlayCircle size={24} weight="bold" /> Fortsett vernerunden
          </Button>
        </section>
      ) : (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-xl ring-1 ring-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-orange-500/15 px-2.5 py-1 text-xs font-bold text-orange-400">
              <Lightning size={14} weight="fill" /> Klar til inspeksjon
            </span>
            <span className="text-xs text-slate-400">{pointCount} sjekkpunkter</span>
          </div>
          <h2 className="mt-3 text-xl font-bold">Start ny vernerunde</h2>
          <p className="mt-1 text-sm text-slate-300">Velg sjekkliste for området du skal gå gjennom.</p>
          <label className="mt-4 block text-[0.7rem] font-bold uppercase tracking-wider text-slate-400" htmlFor="start-template">
            Velg sone / bransjemal
          </label>
          <select
            id="start-template"
            className="mt-2 w-full min-h-12 rounded-xl border border-slate-600 bg-slate-950/60 px-3 text-[0.95rem] font-medium text-white focus:border-orange-500 focus:outline-none"
            value={selected?.id ?? ''}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            {templates?.map((t) => (
              <option key={t.id} value={t.id}>
                {TEMPLATE_EMOJI[t.icon ?? 'annet']} {t.name}
              </option>
            ))}
          </select>
          <Button variant="primary" size="lg" block className="mt-4" onClick={start} disabled={!selected}>
            <PlayCircle size={24} weight="bold" /> Start vernerunde
          </Button>
        </section>
      )}

      <a
        href="#/maler"
        className="flex items-center gap-3 rounded-2xl border border-amber-300/70 bg-amber-50 p-3.5 no-underline transition hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:hover:bg-amber-500/15"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-200/70 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
          <Crown size={24} weight="fill" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-slate-900 dark:text-white">Lag egne sjekklister</span>
          <span className="block text-xs text-slate-600 dark:text-slate-400">Tilpass soner og punkter til arbeidsplassen deres.</span>
        </span>
        <CaretRight size={20} className="text-amber-600 dark:text-amber-400" />
      </a>

      <SectionTitle icon={<WarningCircle size={20} weight="bold" className="text-red-500" />} action={open.length > 3 && <a href="#/avvik" className="text-sm font-semibold text-orange-600 dark:text-orange-500">Se alle</a>}>
        Åpne avvik og tiltak
      </SectionTitle>
      {rounds && open.length === 0 && (
        <Empty icon={<CheckCircle size={32} />} title="Ingen åpne avvik">
          Avvik du registrerer samles her med frist og ansvarlig.
        </Empty>
      )}
      {open.slice(0, 3).map((d) => (
        <DeviationCard key={d.item.id} d={d} now={now} />
      ))}

      {finished.length > 0 && (
        <>
          <SectionTitle icon={<ClipboardText size={20} weight="bold" className="text-slate-400" />}>Tidligere runder</SectionTitle>
          <Card className="!p-0">
            <ul className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {finished.slice(0, 8).map((r) => {
                const s = roundStats(r.areas)
                return (
                  <li key={r.id}>
                    <a href={`#/rapport/${r.id}`} className="flex items-center gap-3 px-4 py-3 no-underline hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{r.title}</span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(r.finishedAt!)} · {s.avvik} avvik · {s.merknad} merknader
                        </span>
                      </span>
                      <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-500">{s.score}%</span>
                      <CaretRight size={18} className="text-slate-400" />
                    </a>
                  </li>
                )
              })}
            </ul>
          </Card>
        </>
      )}
    </AppShell>
  )
}
