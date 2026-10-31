import { CaretRight, ClipboardText, Moon, Sun } from '@phosphor-icons/react'
import { AppShell } from '../components/AppShell'
import { OrgForm } from '../components/OrgForm'
import { Card, cx } from '../components/ui'
import { saveSettings, useSettings } from '../lib/settings'

export function SettingsScreen() {
  const settings = useSettings()
  return (
    <AppShell tab="none">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Innstillinger</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Firmaprofil, personer og utseende.</p>
      </div>
      {settings && <OrgForm settings={settings} />}

      <a href="#/maler" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 no-underline dark:border-slate-700/60 dark:bg-slate-800/60">
        <ClipboardText size={24} className="text-orange-500" />
        <span className="flex-1 font-semibold text-slate-900 dark:text-white">Sjekklister og bransjemaler</span>
        <CaretRight size={18} className="text-slate-400" />
      </a>

      <Card className="flex flex-col gap-3">
        <p className="font-semibold text-slate-900 dark:text-white">Tema</p>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ['dark', 'Mørkt', <Moon key="m" size={20} />],
              ['light', 'Lyst (utendørs)', <Sun key="s" size={20} />],
            ] as const
          ).map(([k, label, icon]) => (
            <button
              key={k}
              type="button"
              aria-pressed={settings?.theme === k}
              onClick={() => saveSettings({ theme: k })}
              className={cx(
                'flex min-h-12 items-center justify-center gap-2 rounded-xl border text-sm font-bold',
                settings?.theme === k ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300',
              )}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </Card>

      <p className="rounded-xl bg-slate-100 p-3 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">
        Alt lagres bare på denne enheten og virker uten nett. Deling mellom flere brukere kommer i en senere versjon.
      </p>
    </AppShell>
  )
}
