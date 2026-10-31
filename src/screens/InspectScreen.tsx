import {
  ArrowCounterClockwise,
  ArrowRight,
  ArrowsSplit,
  BatteryCharging,
  BoundingBox,
  Broom,
  CaretLeft,
  CaretRight,
  Camera,
  CheckCircle,
  Coffee,
  Desktop,
  FireExtinguisher,
  Flask,
  FloppyDisk,
  Garage,
  Info,
  Lightning,
  MapPinLine,
  MinusCircle,
  NotePencil,
  PencilSimple,
  Stack,
  Warning,
  WarningCircle,
  Wind,
  X,
  type Icon,
} from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import { AppShell, openFinding } from '../components/AppShell'
import { ask } from '../components/ConfirmDialog'
import { CriticalNotice } from '../components/CriticalNotice'
import { PhotoStrip } from '../components/Photos'
import { toast } from '../components/Toast'
import { Button, Card, cx, Empty, LinkButton, Pill } from '../components/ui'
import { db, uid } from '../db'
import { dueLabel, newDeviation, SEV_TONE, SEVERITY } from '../lib/deviations'
import { compressImage, stampText } from '../lib/image'
import { flattenItems, restartRound, useInspect, type FlatItem } from '../lib/inspect'
import { addExtraItem, mutateItem, mutateRound, roundStats } from '../lib/rounds'
import { useBlobUrl } from '../lib/useBlobUrl'
import type { Round, Severity } from '../types'

/* ------------------------------------------------------------------ */
/* Felles handlinger                                                   */
/* ------------------------------------------------------------------ */

/** Setter OK. Hvis punktet har et registrert funn, spørres det først. */
async function setOk(round: Round, f: FlatItem, toggle = false) {
  const { item } = f
  if (toggle && item.status === 'ok') return mutateItem(round.id, item.id, (i) => void (i.status = null))
  if ((item.status === 'avvik' || item.status === 'merknad') && (item.comment || item.photoIds.length)) {
    if (!(await ask('Punktet har et registrert funn. Sette det til OK og fjerne funnet?', { confirmLabel: 'Sett til OK', danger: true }))) return
  }
  await mutateItem(round.id, item.id, (i) => {
    i.status = 'ok'
    i.deviation = undefined
    i.comment = ''
    i.photoIds = []
  })
}

async function restOk(round: Round) {
  const left = roundStats(round.areas)
  const n = left.total - left.checked
  if (n === 0) return
  await mutateRound(round.id, (r) => {
    for (const a of r.areas) for (const i of a.items) if (!i.status) i.status = 'ok'
  })
  toast(`${n} punkter markert som OK`)
}

const open = (round: Round, f: FlatItem, kind: 'avvik' | 'merknad', onSaved?: () => void) => openFinding({ round, itemId: f.item.id, kind, onSaved })

function ZoneIcon({ name, size = 22 }: { name: string; size?: number }) {
  const z = name.toLowerCase()
  const map: [string[], Icon][] = [
    [['felt', 'gulv'], BoundingBox],
    [['vareflyt', 'kjør'], ArrowsSplit],
    [['brann', 'rømning', 'nød'], FireExtinguisher],
    [['reol', 'lager', 'høytlager'], Stack],
    [['truck', 'lad'], BatteryCharging],
    [['port', 'rampe'], Garage],
    [['orden', 'renhold'], Broom],
    [['kjemikal', 'pakke'], Flask],
    [['pause', 'garderobe'], Coffee],
    [['arbeidsplass', 'kontor', 'stasjon'], Desktop],
    [['inneklima', 'luft'], Wind],
  ]
  const Ic = map.find(([keys]) => keys.some((k) => z.includes(k)))?.[1] ?? MapPinLine
  return <Ic size={size} weight="bold" />
}

function StatusBanner({ f }: { f: FlatItem }) {
  const { item } = f
  if (item.status === 'ok')
    return (
      <Pill tone="green" className="!px-2.5 !py-1 uppercase">
        <CheckCircle size={14} weight="fill" /> Godkjent
      </Pill>
    )
  if (item.status === 'merknad')
    return (
      <Pill tone="amber" className="!px-2.5 !py-1 uppercase">
        <WarningCircle size={14} weight="fill" /> Merknad
      </Pill>
    )
  if (item.status === 'avvik')
    return (
      <Pill tone="red" className="!px-2.5 !py-1 uppercase">
        <Warning size={14} weight="fill" /> Avvik{item.deviation ? ` (${SEVERITY[item.deviation.severity].label})` : ''}
      </Pill>
    )
  if (item.status === 'na')
    return (
      <Pill tone="slate" className="!px-2.5 !py-1">
        Ikke relevant
      </Pill>
    )
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.7rem] font-semibold text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">Ikke kontrollert ennå</span>
  )
}

function FindingSummary({ round, f }: { round: Round; f: FlatItem }) {
  const { item } = f
  if (item.status !== 'avvik' && item.status !== 'merknad') return null
  return (
    <div className={cx('flex flex-col gap-2 rounded-2xl p-3', item.status === 'avvik' ? 'bg-red-50 dark:bg-red-500/10' : 'bg-amber-50 dark:bg-amber-500/10')}>
      {item.status === 'avvik' && item.deviation && (
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={SEV_TONE[item.deviation.severity]}>{SEVERITY[item.deviation.severity].label}</Pill>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{dueLabel(item.deviation)}</span>
          {item.deviation.responsible && <span className="text-xs text-slate-500 dark:text-slate-400">• {item.deviation.responsible}</span>}
        </div>
      )}
      {item.comment && <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{item.comment}</p>}
      <PhotoStrip photoIds={item.photoIds} size="sm" />
      <div className="flex gap-4">
        <button type="button" onClick={() => open(round, f, item.status as 'avvik' | 'merknad')} className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400">
          <PencilSimple size={14} weight="bold" /> Endre
        </button>
        <button type="button" onClick={() => mutateItem(round.id, item.id, (i) => void (i.status = null))} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <ArrowCounterClockwise size={14} /> Nullstill
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Visning 1: Fokus-kort                                               */
/* ------------------------------------------------------------------ */

function DeckMode({ round, onReset }: { round: Round; onReset: () => void }) {
  const items = flattenItems(round)
  const [idx, setIdx] = useState(0)
  const [anim, setAnim] = useState<'left' | 'right' | null>(null)
  const [showLaw, setShowLaw] = useState(true)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const i = Math.min(idx, Math.max(0, items.length - 1))
  const f = items[i]
  const s = roundStats(round.areas)
  const left = s.total - s.checked

  if (!f) return <Empty icon={<NotePencil size={34} />} title="Ingen sjekkpunkter i denne malen">Legg dem til under Maler.</Empty>

  const nextUnanswered = (from: number) => {
    for (let k = 1; k <= items.length; k++) {
      const j = (from + k) % items.length
      if (!items[j].item.status) return j
    }
    return null
  }

  const advance = () => {
    const n = nextUnanswered(i)
    if (n !== null) setIdx(n)
    else {
      toast('Alle punkter i runden er kontrollert')
      if (i < items.length - 1) setIdx(i + 1)
    }
  }

  const ok = async () => {
    if (f.item.status === 'avvik' || f.item.status === 'merknad') {
      await setOk(round, f)
      return
    }
    setAnim('right')
    await mutateItem(round.id, f.item.id, (it) => {
      it.status = 'ok'
      it.deviation = undefined
    })
    setTimeout(() => {
      setAnim(null)
      advance()
    }, 200)
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    const t = touch.current
    touch.current = null
    if (!t) return
    const dx = e.changedTouches[0].clientX - t.x
    const dy = e.changedTouches[0].clientY - t.y
    if (Math.abs(dx) > 75 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx > 0) void ok()
      else open(round, f, 'avvik', advance)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex flex-col gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-3 shadow-sm dark:border-slate-800 dark:bg-cardDark dark:shadow-none">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="whitespace-nowrap font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
              PUNKT {i + 1} AV {items.length}
            </span>
            <span className="truncate rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {left === 0 ? 'Alle sjekket' : `${left} ubesvart`}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" aria-label="Forrige punkt" disabled={i === 0} onClick={() => setIdx(i - 1)} className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-700 disabled:opacity-30 dark:bg-slate-800 dark:text-slate-300">
              <CaretLeft size={16} weight="bold" />
            </button>
            <button type="button" aria-label="Neste punkt" disabled={i === items.length - 1} onClick={() => setIdx(i + 1)} className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-700 disabled:opacity-30 dark:bg-slate-800 dark:text-slate-300">
              <CaretRight size={16} weight="bold" />
            </button>
            <button type="button" onClick={onReset} className="ml-1 rounded-lg bg-slate-100 px-2.5 py-2 text-[0.7rem] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              Nullstill
            </button>
          </div>
        </div>
        <div className="flex gap-1" role="group" aria-label="Fremdrift">
          {items.map((it, k) => (
            <button
              key={it.item.id}
              type="button"
              aria-label={`Gå til punkt ${k + 1}`}
              onClick={() => setIdx(k)}
              className="group flex h-5 min-w-0 flex-1 items-center"
            >
              <span
                className={cx(
                  'h-2 w-full rounded-full transition',
                  it.item.status === 'ok' && 'bg-emerald-500',
                  it.item.status === 'merknad' && 'bg-amber-500',
                  it.item.status === 'avvik' && 'bg-red-600',
                  it.item.status === 'na' && 'bg-slate-400 dark:bg-slate-600',
                  !it.item.status && 'bg-slate-200 dark:bg-slate-800',
                  k === i && 'ring-2 ring-orange-500 ring-offset-1 ring-offset-white dark:ring-offset-oled',
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div
        className="touch-pan-y"
        onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
        onTouchEnd={onTouchEnd}
      >
        <article
          key={f.item.id}
          aria-live="polite"
          className={cx(
            'flex flex-col gap-4 rounded-3xl border-2 bg-white p-4 shadow-lg dark:bg-cardDark',
            anim === 'right' && 'animate-swipe-right',
            anim === 'left' && 'animate-swipe-left',
            !f.item.status && 'border-slate-200 dark:border-slate-700/80',
            f.item.status === 'ok' && 'border-emerald-500/50',
            f.item.status === 'merknad' && 'border-amber-500/60',
            f.item.status === 'avvik' && 'border-red-500/60',
            f.item.status === 'na' && 'border-slate-300 opacity-70 dark:border-slate-700',
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex max-w-full items-center gap-1 rounded-xl bg-orange-100 px-2.5 py-1.5 text-[0.7rem] font-extrabold uppercase tracking-wide text-orange-700 dark:bg-orange-500/15 dark:text-orange-400">
              <MapPinLine size={14} weight="fill" className="shrink-0" />
              <span className="truncate">{f.area}</span>
            </span>
            <StatusBanner f={f} />
          </div>

          <h2 className="font-display text-[1.35rem] font-extrabold leading-snug tracking-tight text-slate-900 dark:text-white">{f.item.text}</h2>

          {f.item.law && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700/70 dark:bg-oled/60">
              <button type="button" aria-expanded={showLaw} onClick={() => setShowLaw((v) => !v)} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200">
                <Info size={16} weight="fill" className="shrink-0 text-blue-500" />
                <span className="flex-1">Rutine / krav</span>
                <CaretRight size={14} className={cx('transition', showLaw && 'rotate-90')} />
              </button>
              {showLaw && (
                <p className="px-3 pb-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {f.item.law}
                  <span className="mt-1 block opacity-70">Veiledende henvisning. Sjekk gjeldende regelverk på lovdata.no.</span>
                </p>
              )}
            </div>
          )}

          <FindingSummary round={round} f={f} />

          <div className="flex items-center justify-between gap-2 border-t border-slate-200 pt-3 dark:border-slate-700/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">Sveip til sidene eller bruk knappene under</span>
            {f.item.status !== 'ok' && (
              <button
                type="button"
                onClick={() => mutateItem(round.id, f.item.id, (it) => void (it.status = f.item.status === 'na' ? null : 'na')).then(() => f.item.status !== 'na' && advance())}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <MinusCircle size={14} /> {f.item.status === 'na' ? 'Angre' : 'Ikke relevant'}
              </button>
            )}
          </div>
        </article>
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-1">
        {left === 0 && (
          <LinkButton href="#/rapport" variant="primary" block>
            Til oppsummering og signering <ArrowRight size={18} weight="bold" />
          </LinkButton>
        )}
        <div className="grid grid-cols-[1.25fr_0.8fr_1.25fr] gap-2.5">
          <button
            type="button"
            onClick={() => open(round, f, 'avvik', advance)}
            className="flex min-h-[4.5rem] flex-col items-center justify-center gap-0.5 rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/30 transition active:scale-95"
          >
            <span className="flex items-center gap-1.5 text-base font-extrabold">
              <WarningCircle size={22} weight="bold" /> AVVIK
            </span>
            <span className="text-[0.62rem] font-medium opacity-80">Sveip venstre / Foto</span>
          </button>
          <button
            type="button"
            onClick={() => open(round, f, 'merknad', advance)}
            className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-2xl border border-amber-500/50 bg-amber-100 text-xs font-bold text-amber-800 transition active:scale-95 dark:bg-amber-500/15 dark:text-amber-400"
          >
            <NotePencil size={22} weight="bold" />
            Merknad
          </button>
          <button
            type="button"
            onClick={ok}
            className="flex min-h-[4.5rem] flex-col items-center justify-center gap-0.5 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 transition active:scale-95"
          >
            <span className="flex items-center gap-1.5 text-base font-extrabold">
              <CheckCircle size={22} weight="bold" /> GODKJENT
            </span>
            <span className="text-[0.62rem] font-medium opacity-80">Sveip høyre → neste</span>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Visning 2: Sone-fliser                                              */
/* ------------------------------------------------------------------ */

function ZonesMode({ round }: { round: Round }) {
  const [selected, setSelected] = useState<string | null>(null)
  const drill = useRef<HTMLDivElement>(null)
  const items = flattenItems(round)
  const zone = round.areas.find((a) => a.name === selected) ?? round.areas[0]

  if (!zone) return <Empty icon={<NotePencil size={34} />} title="Ingen soner i denne malen">Legg dem til under Maler.</Empty>

  const zoneItems = items.filter((f) => f.area === zone.name)
  const pick = (name: string) => {
    setSelected(name)
    setTimeout(() => drill.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }
  const zoneOk = async () => {
    await mutateRound(round.id, (r) => {
      for (const a of r.areas) if (a.name === zone.name) for (const i of a.items) if (!i.status) i.status = 'ok'
    })
    toast(`Alle punkter i «${zone.name}» er godkjent`)
  }
  const left = roundStats(round.areas)

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 py-3 dark:border-slate-800 dark:bg-cardDark">
        <div className="min-w-0">
          <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-orange-600 dark:text-orange-400">Stasjons- og sonekart</p>
          <h2 className="font-display text-[0.95rem] font-extrabold leading-tight text-slate-900 dark:text-white">Trykk på sonen du befinner deg i</h2>
        </div>
        {left.checked < left.total && (
          <button type="button" onClick={() => restOk(round)} className="shrink-0 rounded-xl border border-emerald-500/40 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            Resten OK
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {round.areas.map((a) => {
          const st = roundStats([a])
          const dev = st.avvik + st.merknad
          const pct = st.total ? Math.round((st.checked / st.total) * 100) : 0
          const on = a.name === zone.name
          return (
            <button
              key={a.id}
              type="button"
              aria-pressed={on}
              onClick={() => pick(a.name)}
              className={cx(
                'flex min-h-[8.5rem] flex-col justify-between gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.98]',
                on ? 'border-orange-500 bg-white ring-2 ring-orange-500/30 dark:bg-cardElevated' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-cardDark',
              )}
            >
              <div className="flex items-start justify-between">
                <span className={cx('grid h-11 w-11 place-items-center rounded-xl', on ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-600 dark:bg-slate-800 dark:text-orange-500')}>
                  <ZoneIcon name={a.name} />
                </span>
                {dev > 0 ? (
                  <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[0.65rem] font-bold text-red-700 dark:bg-red-500/20 dark:text-red-400">{dev} funn</span>
                ) : st.checked === st.total && st.total > 0 ? (
                  <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[0.65rem] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">✓ OK</span>
                ) : st.checked > 0 ? (
                  <span className="font-mono text-[0.68rem] font-bold text-slate-500">
                    {st.checked}/{st.total}
                  </span>
                ) : null}
              </div>
              <div>
                <h3 className="font-display text-[0.9rem] font-extrabold leading-tight text-slate-900 dark:text-white">{a.name}</h3>
                <p className="mt-0.5 font-mono text-[0.68rem] text-slate-500 dark:text-slate-400">
                  {st.checked} av {st.total} sjekket
                </p>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div className={cx('h-full rounded-full transition-all', dev > 0 ? 'bg-red-500' : 'bg-emerald-500')} style={{ width: `${pct}%` }} />
              </div>
            </button>
          )
        })}
      </div>

      <div ref={drill} className="scroll-mt-52 rounded-3xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-cardDark dark:shadow-none">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-orange-600 dark:text-orange-400">Valgt sone ({zoneItems.length} punkter)</p>
            <h3 className="font-display text-lg font-extrabold leading-tight text-slate-900 dark:text-white">{zone.name}</h3>
          </div>
          <button type="button" onClick={zoneOk} className="shrink-0 rounded-xl border border-emerald-500/40 bg-emerald-50 px-2.5 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            ✓ Godkjenn sonen
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {zoneItems.map((f, n) => (
            <ItemRow key={f.item.id} round={round} f={f} n={n + 1} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ItemRow({ round, f, n }: { round: Round; f: FlatItem; n: number }) {
  const s = f.item.status
  const [law, setLaw] = useState(false)
  return (
    <div
      className={cx(
        'flex flex-col gap-2.5 rounded-2xl border bg-slate-50 p-3 dark:bg-oled/70',
        s === 'ok' ? 'border-emerald-500/50' : s === 'avvik' ? 'border-red-500/60' : s === 'merknad' ? 'border-amber-500/60' : 'border-slate-200 dark:border-slate-800',
        s === 'na' && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-2">
        <p className="flex-1 text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
          <span className="mr-1.5 font-mono text-xs text-slate-400">{n}.</span>
          {f.item.text}
        </p>
        {f.item.law && (
          <button type="button" aria-label="Vis lovhenvisning" aria-expanded={law} onClick={() => setLaw((v) => !v)} className={cx('grid h-8 w-8 shrink-0 place-items-center rounded-full', law ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-300')}>
            <Info size={16} weight="bold" />
          </button>
        )}
      </div>
      {law && f.item.law && <p className="rounded-xl bg-blue-50 p-2.5 text-xs leading-relaxed text-blue-900 dark:bg-blue-500/10 dark:text-blue-200">{f.item.law}</p>}
      <FindingSummary round={round} f={f} />
      <StatusRow round={round} f={f} />
    </div>
  )
}

function StatusRow({ round, f, compact }: { round: Round; f: FlatItem; compact?: boolean }) {
  const s = f.item.status
  const base = 'flex items-center justify-center gap-1 rounded-xl font-bold transition active:scale-95'
  const size = compact ? 'min-h-10 px-3 text-xs' : 'min-h-11 py-2 text-xs'
  return (
    <div className={compact ? 'flex shrink-0 gap-1.5' : 'grid grid-cols-3 gap-2'}>
      <button type="button" aria-pressed={s === 'ok'} onClick={() => setOk(round, f, true)} className={cx(base, size, s === 'ok' ? 'bg-emerald-600 text-white' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400')}>
        <CheckCircle size={16} weight="bold" /> OK
      </button>
      {!compact && (
        <button type="button" aria-pressed={s === 'merknad'} onClick={() => open(round, f, 'merknad')} className={cx(base, size, s === 'merknad' ? 'bg-amber-500 text-slate-950' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400')}>
          Merknad
        </button>
      )}
      <button type="button" aria-pressed={s === 'avvik'} onClick={() => open(round, f, 'avvik')} className={cx(base, size, s === 'avvik' ? 'bg-red-600 text-white' : 'bg-red-500/10 text-red-700 dark:text-red-400')}>
        <Warning size={16} weight="bold" /> Avvik
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Visning 3: Kamera-først                                             */
/* ------------------------------------------------------------------ */

function CameraMode({ round, quickTags }: { round: Round; quickTags: string[] }) {
  const zones = round.areas.map((a) => a.name)
  const [zone, setZone] = useState(zones[0] ?? '')
  const [tags, setTags] = useState<string[]>([])
  const [sev, setSev] = useState<Severity>('middels')
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const url = useBlobUrl(photo)
  const items = flattenItems(round)
  const currentZone = zones.includes(zone) ? zone : (zones[0] ?? '')
  const s = roundStats(round.areas)

  const takePhoto = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      setPhoto(await compressImage(file, 1600, 0.8, 'image/jpeg', stampText(currentZone || 'Vernerunde')))
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  const save = async () => {
    const text = tags.join(' • ') || note.trim() || 'Avvik registrert med bilde'
    if (!tags.length && !note.trim() && !photo) {
      toast('Velg en hurtig-etikett, ta et bilde eller skriv et notat')
      return
    }
    setBusy(true)
    try {
      const itemId = await addExtraItem(round.id, text, currentZone || undefined)
      let photoIds: string[] = []
      if (photo) {
        const id = uid()
        await db.photos.add({ id, roundId: round.id, blob: photo, createdAt: Date.now() })
        photoIds = [id]
      }
      await mutateItem(round.id, itemId, (i) => {
        i.status = 'avvik'
        i.comment = tags.length ? note.trim() : ''
        i.photoIds = photoIds
        i.deviation = newDeviation(sev)
      })
      setTags([])
      setNote('')
      setPhoto(null)
      toast(sev === 'kritisk' ? 'Kritisk avvik er lagret. Si fra til leder nå.' : 'Avviket er lagret i tiltakslisten')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3.5 rounded-3xl border-2 border-orange-500/40 bg-white p-4 shadow-lg dark:bg-cardDark">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-100 text-red-600 dark:bg-red-500/15">
              <Lightning size={22} weight="fill" />
            </span>
            <div>
              <h2 className="font-display text-base font-extrabold leading-tight text-slate-900 dark:text-white">5-sekunders lyn-avvik</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Knips bilde og trykk på ferdige etiketter</p>
            </div>
          </div>
          <Pill tone={SEV_TONE[sev]} className="shrink-0 uppercase">
            {SEVERITY[sev].label} ({SEVERITY[sev].hint})
          </Pill>
        </div>

        <input ref={input} id="quick-camera" type="file" accept="image/*" capture="environment" hidden onChange={(e) => takePhoto(e.target.files?.[0])} />
        {url ? (
          <div className="relative overflow-hidden rounded-2xl">
            <img src={url} alt="Bilde av avviket" className="max-h-56 w-full object-cover" />
            <button type="button" onClick={() => setPhoto(null)} className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-slate-950/70 px-2 py-1.5 text-xs font-semibold text-white">
              <X size={14} weight="bold" /> Fjern bilde
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" disabled={busy} onClick={() => input.current?.click()} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-orange-600 px-3 text-sm font-extrabold text-white shadow-lg shadow-orange-600/30 transition active:scale-95">
              <Camera size={22} weight="fill" /> {busy ? 'Lagrer…' : '1. Ta bilde nå'}
            </button>
            <button type="button" onClick={() => openFinding({ round, itemId: null, kind: 'avvik' })} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 transition active:scale-95 dark:border-slate-700 dark:bg-cardElevated dark:text-slate-200">
              <NotePencil size={20} weight="bold" /> Utvidet skjema
            </button>
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">2. Trykk på én eller flere etiketter</p>
            <a href="#/maler" className="shrink-0 text-xs font-bold text-orange-600 dark:text-orange-400">
              + Egne etiketter
            </a>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {quickTags.map((t) => {
              const on = tags.includes(t)
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setTags((x) => (on ? x.filter((y) => y !== t) : [...x, t]))}
                  className={cx(
                    'rounded-xl border px-3 py-2 text-xs font-bold transition active:scale-95',
                    on ? 'border-red-600 bg-red-600 text-white' : 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-cardElevated dark:text-slate-300',
                  )}
                >
                  {on ? '✓ ' : '+ '}
                  {t}
                </button>
              )
            })}
            {quickTags.length === 0 && <p className="text-xs text-slate-500">Ingen etiketter ennå. Legg dem til under Maler.</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[0.68rem] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Sone / stasjon</span>
            <select id="quick-zone" value={currentZone} onChange={(e) => setZone(e.target.value)} className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-cardElevated dark:text-slate-100">
              {zones.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-1">
            <span className="text-[0.68rem] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Alvorlighetsgrad</span>
            <div className="grid grid-cols-3 gap-1" role="radiogroup" aria-label="Alvorlighetsgrad">
              {(Object.keys(SEVERITY) as Severity[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={sev === k}
                  onClick={() => setSev(k)}
                  className={cx(
                    'h-11 rounded-lg border px-0.5 text-[0.68rem] font-bold',
                    sev !== k && 'border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-cardElevated',
                    sev === k && k === 'lav' && 'border-blue-500 bg-blue-500/15 text-blue-600 dark:text-blue-400',
                    sev === k && k === 'middels' && 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400',
                    sev === k && k === 'kritisk' && 'border-red-500 bg-red-500/15 text-red-600 dark:text-red-400',
                  )}
                >
                  {SEVERITY[k].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {sev === 'kritisk' && <CriticalNotice />}

        <div className="flex gap-2">
          <input
            id="quick-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Valgfri kommentar…"
            className="h-12 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-cardElevated dark:text-slate-100"
          />
          <button type="button" disabled={busy} onClick={save} className="flex h-12 shrink-0 items-center gap-1.5 rounded-xl bg-red-600 px-4 text-sm font-extrabold text-white shadow-lg shadow-red-600/30 transition active:scale-95 disabled:opacity-50">
            <FloppyDisk size={20} weight="fill" /> Lagre avvik
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-cardDark">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-sm font-extrabold uppercase tracking-wide text-slate-600 dark:text-slate-300">Hurtig-sjekkliste</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Huk av OK i fart uten å åpne hvert kort</p>
          </div>
          {s.checked < s.total && (
            <button type="button" onClick={() => restOk(round)} className="shrink-0 rounded-xl border border-emerald-500/40 bg-emerald-50 px-2.5 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              Huk av alle OK
            </button>
          )}
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((f, n) => (
            <li key={f.item.id} className="flex items-center gap-2.5 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.65rem] font-extrabold uppercase tracking-wide text-orange-600 dark:text-orange-400">{f.area}</p>
                <p className="text-[0.82rem] font-semibold leading-snug text-slate-900 dark:text-slate-100">
                  {n + 1}. {f.item.text}
                </p>
                {f.item.status === 'avvik' && f.item.deviation && <p className="mt-0.5 text-xs font-semibold text-red-600 dark:text-red-400">Avvik · {dueLabel(f.item.deviation)}</p>}
                {f.item.status === 'merknad' && <p className="mt-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">Merknad registrert</p>}
              </div>
              <StatusRow round={round} f={f} compact />
            </li>
          ))}
        </ul>
        {s.checked === s.total && (
          <LinkButton href="#/rapport" variant="primary" block className="mt-3">
            Til oppsummering og signering <ArrowRight size={18} weight="bold" />
          </LinkButton>
        )}
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Skjermen                                                            */
/* ------------------------------------------------------------------ */

export function InspectScreen() {
  const { settings, template, round } = useInspect()
  const mode = settings?.designMode ?? 'deck'

  const reset = async () => {
    if (!round) return
    if (!(await ask('Nullstille runden? Alle svar, bilder og funn i denne runden slettes, og sjekklisten starter på nytt.', { confirmLabel: 'Nullstill', danger: true }))) return
    await restartRound(round, settings)
    toast('Runden er nullstilt')
  }

  if (!settings || template === undefined || round === undefined) return <AppShell tab="runde">{null}</AppShell>
  if (!template) {
    return (
      <AppShell tab="runde">
        <Empty icon={<NotePencil size={34} />} title="Ingen sjekklister ennå">
          <LinkButton href="#/maler" variant="primary" className="mt-3">
            Lag en sjekkliste
          </LinkButton>
        </Empty>
      </AppShell>
    )
  }

  return (
    <AppShell tab="runde">
      {round && (
        <>
          {mode === 'deck' && <DeckMode key={round.id} round={round} onReset={reset} />}
          {mode === 'zones' && <ZonesMode key={round.id} round={round} />}
          {mode === 'camera' && <CameraMode key={round.id} round={round} quickTags={settings.quickTags} />}
          {mode !== 'deck' && (
            <Card className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">Vil du starte på nytt med en tom sjekkliste?</p>
              <Button size="sm" onClick={reset}>
                <ArrowCounterClockwise size={16} /> Nullstill runde
              </Button>
            </Card>
          )}
        </>
      )}
      {!round && (
        <div className="grid flex-1 place-items-center text-sm text-slate-500" aria-busy="true">
          Starter runde…
        </div>
      )}
      {mode !== 'deck' && round && (
        <LinkButton href="#/rapport" variant="primary" size="lg" block>
          Gå til rapport og signering
        </LinkButton>
      )}
    </AppShell>
  )
}
