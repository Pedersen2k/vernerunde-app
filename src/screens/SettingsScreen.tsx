import { CaretRight, ClipboardText, DownloadSimple, Moon, Sun, Trash, UploadSimple } from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import { AppShell } from '../components/AppShell'
import { OrgForm } from '../components/OrgForm'
import { ask } from '../components/ConfirmDialog'
import { toast } from '../components/Toast'
import { Button, Card, cx } from '../components/ui'
import { exportBackup, importBackup, resetEverything } from '../lib/backup'
import { downloadBlob } from '../lib/share'
import { saveSettings, useSettings } from '../lib/settings'

function Backup() {
  const file = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  return (
    <Card className="flex flex-col gap-3">
      <div>
        <p className="font-semibold text-slate-900 dark:text-white">Sikkerhetskopi</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Alt ligger bare på denne telefonen. Ta en kopi jevnlig, og før du bytter telefon eller sletter nettleserdata. Kopien inneholder sjekklister, runder, bilder og firmaprofil.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              const name = `vernerunde-sikkerhetskopi-${new Date().toISOString().slice(0, 10)}.json`
              if (await downloadBlob(await exportBackup(), name)) toast('Sikkerhetskopien er lagret')
            } catch {
              toast('Klarte ikke å lage sikkerhetskopi')
            } finally {
              setBusy(false)
            }
          }}
        >
          <DownloadSimple size={18} weight="bold" /> Eksporter
        </Button>
        <Button disabled={busy} onClick={() => file.current?.click()}>
          <UploadSimple size={18} weight="bold" /> Importer
        </Button>
        <input
          ref={file}
          id="import-backup"
          type="file"
          accept=".json,application/json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            if (!(await ask('Importen erstatter alle data på denne enheten med innholdet i filen. Fortsette?', { confirmLabel: 'Importer', danger: true }))) return
            setBusy(true)
            try {
              await importBackup(f)
              toast('Sikkerhetskopien er hentet inn')
            } catch (err) {
              toast(err instanceof Error ? err.message : 'Klarte ikke å importere filen')
            } finally {
              setBusy(false)
            }
          }}
        />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3 dark:border-slate-800">
        <span className="text-xs text-slate-500 dark:text-slate-400">Tilbakestill standarddata?</span>
        <Button
          size="sm"
          variant="ghost"
          className="!text-red-600 dark:!text-red-400"
          onClick={async () => {
            if (!(await ask('Slette ALT (runder, bilder, egne sjekklister og firmaprofil) og starte på nytt? Dette kan ikke angres. Ta sikkerhetskopi først.', { confirmLabel: 'Slett alt', danger: true }))) return
            await resetEverything()
            toast('Alt er nullstilt')
            window.location.hash = '#/'
          }}
        >
          <Trash size={16} /> Nullstill alt
        </Button>
      </div>
    </Card>
  )
}

export function SettingsScreen() {
  const settings = useSettings()
  return (
    <AppShell tab="none">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Innstillinger</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Firmaprofil, personer og utseende.</p>
      </div>
      {settings && <OrgForm settings={settings} />}

      <a href="#/maler" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 no-underline dark:border-slate-800 dark:bg-cardDark">
        <ClipboardText size={24} className="text-orange-500" />
        <span className="flex-1 font-semibold text-slate-900 dark:text-white">Sjekklister og bransjemaler</span>
        <CaretRight size={18} className="text-slate-400" />
      </a>

      <Backup />

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
        Alt lagres bare på denne enheten og virker uten nett. Legg appen på startskjermen for best opplevelse. Deling mellom flere brukere kommer i en senere versjon.
      </p>
    </AppShell>
  )
}
