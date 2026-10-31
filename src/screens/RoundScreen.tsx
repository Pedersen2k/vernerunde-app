import { ArrowCounterClockwise, CheckCircle, ClipboardText, Info, MinusCircle, PencilSimple, Question, Signature, Warning, WarningCircle } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { AppShell, openFinding } from '../components/AppShell'
import { PhotoStrip } from '../components/Photos'
import { toast } from '../components/Toast'
import { Button, Card, cx, Empty, LinkButton, Pill } from '../components/ui'
import { db } from '../db'
import { dueLabel, SEV_TONE, SEVERITY } from '../lib/deviations'
import { mutateItem, mutateRound, roundStats } from '../lib/rounds'
import type { Round, RoundItem } from '../types'

function ItemCard({ round, item, n, locked }: { round: Round; item: RoundItem; n: number; locked: boolean }) {
  const [showLaw, setShowLaw] = useState(false)
  const set = (fn: (i: RoundItem) => void) => mutateItem(round.id, item.id, fn)
  const s = item.status

  const btn = (kind: 'ok' | 'merknad' | 'avvik') => {
    const on = s === kind
    const base = 'flex min-h-11 items-center justify-center gap-1.5 rounded-xl border text-sm font-bold transition active:scale-[0.97] disabled:active:scale-100'
    const styles = {
      ok: on
        ? 'border-emerald-500 bg-emerald-500 text-white dark:bg-emerald-600'
        : 'border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
      merknad: on
        ? 'border-amber-500 bg-amber-500 text-white dark:text-slate-950'
        : 'border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
      avvik: on ? 'border-red-600 bg-red-600 text-white' : 'border-red-500/40 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    }
    const Icon = kind === 'ok' ? CheckCircle : kind === 'merknad' ? WarningCircle : Warning
    const label = kind === 'ok' ? 'OK' : kind === 'merknad' ? 'Merknad' : 'Avvik'
    return (
      <button
        type="button"
        disabled={locked}
        aria-pressed={on}
        className={cx(base, styles[kind], locked && !on && 'opacity-40')}
        onClick={() => {
          if (kind === 'ok') set((i) => void (i.status = on ? null : 'ok'))
          else openFinding({ round, itemId: item.id, kind })
        }}
      >
        <Icon size={18} weight={on ? 'fill' : 'bold'} />
        {label}
      </button>
    )
  }

  return (
    <Card
      className={cx(
        'flex flex-col gap-3 transition',
        s === 'ok' && '!border-emerald-500/40',
        s === 'merknad' && '!border-amber-500/50',
        s === 'avvik' && '!border-red-500/50',
        s === 'na' && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cx(
            'grid h-7 min-w-7 shrink-0 place-items-center rounded-lg px-1.5 text-xs font-bold tabular-nums',
            s === 'ok' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
          )}
        >
          {s === 'ok' ? <CheckCircle size={16} weight="bold" /> : n}
        </span>
        <p className="min-w-0 flex-1 pt-0.5 text-[0.95rem] font-semibold leading-snug text-slate-900 dark:text-white">{item.text}</p>
        {item.law && (
          <button
            type="button"
            aria-label="Vis lovhenvisning"
            aria-expanded={showLaw}
            onClick={() => setShowLaw((v) => !v)}
            className={cx(
              'grid h-8 w-8 shrink-0 place-items-center rounded-full transition',
              showLaw ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-800 dark:bg-slate-700 dark:text-slate-300 dark:hover:text-white',
            )}
          >
            <Question size={18} weight="bold" />
          </button>
        )}
      </div>

      {showLaw && item.law && (
        <p className="flex gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs leading-relaxed text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
          <Info size={16} weight="fill" className="mt-px shrink-0 text-blue-500" />
          <span>
            {item.law}
            <span className="mt-1 block opacity-70">Veiledende henvisning. Sjekk gjeldende regelverk på lovdata.no.</span>
          </span>
        </p>
      )}

      {s !== 'na' && (
        <div className="grid grid-cols-3 gap-2">
          {btn('ok')}
          {btn('merknad')}
          {btn('avvik')}
        </div>
      )}

      {(s === 'avvik' || s === 'merknad') && (
        <div className={cx('flex flex-col gap-2 rounded-xl p-3', s === 'avvik' ? 'bg-red-50 dark:bg-red-500/10' : 'bg-amber-50 dark:bg-amber-500/10')}>
          {s === 'avvik' && item.deviation && (
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={SEV_TONE[item.deviation.severity]}>{SEVERITY[item.deviation.severity].label}</Pill>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{dueLabel(item.deviation)}</span>
              {item.deviation.responsible && <span className="text-xs text-slate-500 dark:text-slate-400">• {item.deviation.responsible}</span>}
            </div>
          )}
          {item.comment && <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{item.comment}</p>}
          <PhotoStrip photoIds={item.photoIds} size="sm" />
          {!locked && (
            <div className="flex gap-4">
              <button type="button" onClick={() => openFinding({ round, itemId: item.id, kind: s })} className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400">
                <PencilSimple size={14} weight="bold" /> Endre
              </button>
              <button type="button" onClick={() => set((i) => void (i.status = null))} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <ArrowCounterClockwise size={14} /> Nullstill
              </button>
            </div>
          )}
        </div>
      )}

      {!locked && (s === null || s === 'na') && (
        <button
          type="button"
          onClick={() => set((i) => void (i.status = s === 'na' ? null : 'na'))}
          className="inline-flex items-center gap-1 self-start text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <MinusCircle size={14} /> {s === 'na' ? 'Ikke relevant – angre' : 'Ikke relevant'}
        </button>
      )}
    </Card>
  )
}

export function RoundScreen({ id }: { id?: string }) {
  const round = useLiveQuery(async () => {
    if (id) return (await db.rounds.get(id)) ?? null
    const all = await db.rounds.orderBy('startedAt').reverse().toArray()
    return all.find((r) => !r.finishedAt) ?? null
  }, [id])

  if (round === undefined) return <AppShell tab="runde">{null}</AppShell>
  if (round === null) {
    return (
      <AppShell tab="runde">
        <Empty icon={<ClipboardText size={36} />} title="Ingen pågående vernerunde">
          <p>Start en ny runde fra oversikten.</p>
          <LinkButton href="#/" variant="primary" className="mt-3">
            Til oversikten
          </LinkButton>
        </Empty>
      </AppShell>
    )
  }

  const s = roundStats(round.areas)
  const pct = s.total ? Math.round((s.checked / s.total) * 100) : 0
  const locked = round.finishedAt !== null
  let n = 0

  const restOk = async () => {
    await mutateRound(round.id, (r) => {
      for (const a of r.areas) for (const i of a.items) if (!i.status) i.status = 'ok'
    })
    toast(`${s.total - s.checked} punkter markert som OK`)
  }

  return (
    <AppShell tab="runde">
      <div className="sticky top-[calc(env(safe-area-inset-top,0px)+63px)] z-20 -mx-4 -mt-4 bg-slate-50/95 px-4 pb-2 pt-3 backdrop-blur dark:bg-slate-950/95">
      <Card className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate rounded-md bg-orange-100 px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wider text-orange-700 dark:bg-orange-500/15 dark:text-orange-400">
            {round.templateName ?? round.title}
          </span>
          {!locked && s.checked < s.total && (
            <button type="button" onClick={restOk} className="shrink-0 text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400">
              Resten OK
            </button>
          )}
        </div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Punkt {s.checked} av {s.total} kontrollert ({pct}%)
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </Card>
      </div>

      {locked && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
          Runden er fullført og låst. Se rapporten for detaljer.
        </p>
      )}

      {round.areas.map((a) => (
        <section key={a.id} className="flex flex-col gap-3">
          <h2 className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {a.name} <span className="font-semibold normal-case tracking-normal">· {roundStats([a]).checked}/{a.items.length}</span>
          </h2>
          {a.items.map((item) => (
            <ItemCard key={item.id} round={round} item={item} n={++n} locked={locked} />
          ))}
        </section>
      ))}

      <LinkButton href={`#/rapport/${round.id}`} variant="primary" size="lg" block className="mt-2">
        <Signature size={22} weight="bold" /> {locked ? 'Se rapport' : 'Gå til oppsummering og signering'}
      </LinkButton>
      {!locked && (
        <Button variant="ghost" size="sm" onClick={() => openFinding({ round, itemId: null, kind: 'avvik' })}>
          + Registrer funn som ikke står på lista
        </Button>
      )}
    </AppShell>
  )
}
