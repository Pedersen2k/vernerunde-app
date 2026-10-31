import { ClipboardText, FirstAidKit, Gear, House, Moon, Signature, Sun } from '@phosphor-icons/react'
import { useEffect, useSyncExternalStore, type ReactNode } from 'react'
import { activeRound } from '../lib/rounds'
import { saveSettings, useSettings } from '../lib/settings'
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
  const round = await activeRound()
  openFinding({ round, itemId: null, kind: 'avvik' })
}

export type Tab = 'oversikt' | 'runde' | 'rapport' | 'none'

export function AppShell({ tab, children }: { tab: Tab; children: ReactNode }) {
  const settings = useSettings()
  const dark = settings?.theme !== 'light'

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex max-w-2xl items-center gap-3 py-3 pl-[max(16px,env(safe-area-inset-left,0px))] pr-[max(16px,env(safe-area-inset-right,0px))]">
          <a href="#/innstillinger" className="flex min-w-0 flex-1 items-center gap-3 no-underline" aria-label="Firmaprofil">
            {settings && <Logo settings={settings} size={38} />}
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[0.95rem] font-extrabold leading-tight text-slate-900 dark:text-white">
                Vernerunde
                <span className="rounded border border-amber-400/60 bg-amber-100 px-1 text-[0.6rem] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                  Pro
                </span>
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{settings?.companyName || 'Sett opp firmaprofil'}</p>
            </div>
          </a>
          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 min-[460px]:inline-flex dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Lagret lokalt
          </span>
          <button
            type="button"
            aria-label={dark ? 'Bytt til lyst tema' : 'Bytt til mørkt tema'}
            onClick={() => saveSettings({ theme: dark ? 'light' : 'dark' })}
            className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <a
            href="#/innstillinger"
            aria-label="Innstillinger"
            className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Gear size={20} />
          </a>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 pb-[calc(112px+env(safe-area-inset-bottom,0px))] pl-[max(16px,env(safe-area-inset-left,0px))] pr-[max(16px,env(safe-area-inset-right,0px))] pt-4">
        {children}
      </main>

      <nav
        aria-label="Hovedmeny"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95"
      >
        <div className="mx-auto grid max-w-2xl grid-cols-[1fr_1fr_auto_1fr] items-center gap-1 px-2 pb-[calc(8px+env(safe-area-inset-bottom,0px))] pt-2">
          <NavLink href="#/" active={tab === 'oversikt'} icon={<House size={24} weight={tab === 'oversikt' ? 'fill' : 'regular'} />} label="Oversikt" />
          <NavLink href="#/runde" active={tab === 'runde'} icon={<ClipboardText size={24} weight={tab === 'runde' ? 'fill' : 'regular'} />} label="Vernerunde" />
          <button
            type="button"
            onClick={openQuickFinding}
            className="mx-auto flex min-h-12 items-center gap-1.5 rounded-2xl bg-red-600 px-3 text-sm font-bold text-white shadow-lg shadow-red-600/40 transition hover:bg-red-500 active:scale-95"
          >
            <FirstAidKit size={20} weight="fill" />
            <span className="whitespace-nowrap">Nytt avvik</span>
          </button>
          <NavLink href="#/rapport" active={tab === 'rapport'} icon={<Signature size={24} weight={tab === 'rapport' ? 'fill' : 'regular'} />} label="Rapport" />
        </div>
      </nav>
    </div>
  )
}

function NavLink({ href, active, icon, label }: { href: string; active: boolean; icon: ReactNode; label: string }) {
  return (
    <a
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cx(
        'flex flex-col items-center gap-0.5 rounded-xl py-1 text-[0.72rem] font-semibold no-underline transition',
        active ? 'text-orange-600 dark:text-orange-500' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
      )}
    >
      {icon}
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

