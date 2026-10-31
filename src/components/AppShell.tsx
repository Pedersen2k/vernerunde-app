import { CaretDown, Cards, ClipboardText, FilePdf, FirstAidKit, Gear, Lightning, Moon, SlidersHorizontal, SquaresFour, Sun, WarningCircle } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useSyncExternalStore, type ReactNode } from 'react'
import { db } from '../db'
import { collectDeviations } from '../lib/deviations'
import { findActiveRound, selectTemplate, useInspect } from '../lib/inspect'
import { roundStats } from '../lib/rounds'
import { saveSettings, useSettings } from '../lib/settings'
import type { DesignMode } from '../types'
import { FindingSheet, type FindingTarget } from './FindingSheet'
import { Logo } from './Logo'
import { cx } from './ui'

/* ---- Global styring av registreringsarket, så «Nytt avvik» virker fra alle skjermer ---- */
let finding: FindingTarget | null = null
const listeners = new Set<() => void>()
// oxlint-disable-next-line react/only-export-components
export function openFinding(t: FindingTarget | null) {
  finding = t
  listeners.forEach((l) => l())
}
export function FindingHost() {
  const t = useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => finding,
  )
  return <FindingSheet target={t} onClose={() => openFinding(null)} />
}

// oxlint-disable-next-line react/only-export-components
export async function openQuickFinding() {
  const settings = await db.settings.get('org')
  const templates = await db.templates.toArray()
  const template = templates.find((t) => t.id === settings?.currentTemplateId) ?? templates.sort((a, b) => a.createdAt - b.createdAt)[0]
  const round = template ? await findActiveRound(template.id) : null
  openFinding({ round, itemId: null, kind: 'avvik' })
}

export type Tab = 'runde' | 'avvik' | 'maler' | 'rapport' | 'none'

const MODES: { id: DesignMode; label: string; icon: ReactNode }[] = [
  { id: 'deck', label: 'Fokus-kort', icon: <Cards size={16} weight="bold" /> },
  { id: 'zones', label: 'Soner', icon: <SquaresFour size={16} weight="bold" /> },
  { id: 'camera', label: 'Kamera-først', icon: <Lightning size={16} weight="bold" /> },
]

export function AppShell({ tab, children }: { tab: Tab; children: ReactNode }) {
  const { settings, templates, template, round } = useInspect()
  const dark = settings?.theme !== 'light'
  const openCount = useLiveQuery(async () => collectDeviations(await db.rounds.toArray()).filter((d) => d.deviation.resolvedAt === null).length, [])
  const stats = round ? roundStats(round.areas) : null
  const mode = settings?.designMode ?? 'deck'
  const iconBtn =
    'grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700 hover:border-orange-500/50 dark:border-slate-800 dark:bg-cardDark dark:text-slate-300'

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800/90 dark:bg-oled/95">
        <div className="mx-auto flex max-w-xl flex-col gap-2 pb-2.5 pl-[max(14px,env(safe-area-inset-left,0px))] pr-[max(14px,env(safe-area-inset-right,0px))] pt-3">
          <div className="flex items-center gap-2.5">
            <a href="#/innstillinger" className="flex min-w-0 flex-1 items-center gap-2.5 no-underline" aria-label="Firmaprofil og innstillinger">
              {settings && <Logo settings={settings} size={38} />}
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-display text-[0.95rem] font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">
                  Vernerunde Pro
                  {stats && (
                    <span
                      className={cx(
                        'rounded border px-1.5 py-px font-mono text-[0.62rem] font-bold',
                        stats.checked === stats.total
                          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
                      )}
                      aria-label={`${stats.checked} av ${stats.total} punkter kontrollert`}
                    >
                      {stats.checked}/{stats.total}
                    </span>
                  )}
                </p>
                <p className="flex items-center gap-1 truncate text-[0.7rem] text-slate-500 dark:text-slate-400">
                  <span className="truncate">{settings?.companyName || 'Sett opp firmaprofil'}</span>
                  <CaretDown size={10} weight="bold" className="shrink-0" />
                </p>
              </div>
            </a>
            <button type="button" aria-label={dark ? 'Bytt til lyst tema' : 'Bytt til mørkt tema'} onClick={() => saveSettings({ theme: dark ? 'light' : 'dark' })} className={iconBtn}>
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <a href="#/innstillinger" aria-label="Innstillinger og sikkerhetskopi" className={iconBtn}>
              <Gear size={19} />
            </a>
          </div>

          {tab === 'runde' && templates && template && (
            <>
              <label className="relative block">
                <span className="sr-only">Velg sjekkliste</span>
                <select
                  id="template-select"
                  value={template.id}
                  onChange={(e) => selectTemplate(e.target.value)}
                  className="h-10 w-full appearance-none truncate rounded-xl border border-slate-200 bg-slate-100 pl-3 pr-9 text-sm font-semibold text-slate-800 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-cardDark dark:text-slate-100"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <CaretDown size={14} weight="bold" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
              </label>
              <div role="tablist" aria-label="Visning" className="grid grid-cols-3 gap-1 rounded-2xl border border-slate-300/60 bg-slate-200/80 p-1 dark:border-slate-800 dark:bg-cardDark">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    role="tab"
                    aria-selected={mode === m.id}
                    onClick={() => saveSettings({ designMode: m.id })}
                    className={cx(
                      'flex items-center justify-center gap-1.5 rounded-xl px-1 py-2 text-[0.72rem] font-bold transition',
                      mode === m.id ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
                    )}
                  >
                    {m.icon}
                    <span className="whitespace-nowrap">{m.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 pb-[calc(112px+env(safe-area-inset-bottom,0px))] pl-[max(14px,env(safe-area-inset-left,0px))] pr-[max(14px,env(safe-area-inset-right,0px))] pt-4">
        {children}
      </main>

      <nav aria-label="Hovedmeny" className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-oled/95">
        <div className="mx-auto grid max-w-xl grid-cols-[1fr_1fr_auto_1fr_1fr] items-center gap-1 px-2 pb-[calc(8px+env(safe-area-inset-bottom,0px))] pt-2">
          <NavLink href="#/" active={tab === 'runde'} icon={<ClipboardText size={24} weight={tab === 'runde' ? 'fill' : 'regular'} />} label="Vernerunde" />
          <NavLink
            href="#/avvik"
            active={tab === 'avvik'}
            icon={<WarningCircle size={24} weight={tab === 'avvik' ? 'fill' : 'regular'} />}
            label="Avvik"
            badge={openCount}
          />
          <button
            type="button"
            onClick={openQuickFinding}
            className="mx-1 flex min-h-12 items-center gap-1.5 rounded-2xl bg-red-600 px-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/40 transition hover:bg-red-500 active:scale-95"
          >
            <FirstAidKit size={20} weight="fill" />
            <span className="whitespace-nowrap">+ Avvik</span>
          </button>
          <NavLink href="#/maler" active={tab === 'maler'} icon={<SlidersHorizontal size={24} weight={tab === 'maler' ? 'fill' : 'regular'} />} label="Maler" />
          <NavLink href="#/rapport" active={tab === 'rapport'} icon={<FilePdf size={24} weight={tab === 'rapport' ? 'fill' : 'regular'} />} label="Rapport" />
        </div>
      </nav>
    </div>
  )
}

function NavLink({ href, active, icon, label, badge }: { href: string; active: boolean; icon: ReactNode; label: string; badge?: number }) {
  return (
    <a
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cx(
        'relative flex flex-col items-center gap-0.5 rounded-xl py-1 text-[0.7rem] font-semibold no-underline transition',
        active ? 'text-orange-600 dark:text-orange-500' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
      )}
    >
      <span className="relative">
        {icon}
        {!!badge && (
          <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 font-mono text-[0.6rem] font-bold text-white" aria-label={`${badge} åpne`}>
            {badge}
          </span>
        )}
      </span>
      {label}
    </a>
  )
}

/** Holder `dark`-klassen på <html> i takt med valgt tema. */
export function ThemeSync() {
  const s = useSettings()
  const theme = s?.theme ?? 'dark'
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
  }, [theme])
  return null
}

