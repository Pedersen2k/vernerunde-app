import { Plus, UploadSimple, X } from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import { compressImage } from '../lib/image'
import { saveSettings } from '../lib/settings'
import type { OrgSettings } from '../types'
import { Logo } from './Logo'
import { Button, Card, cx, Field, inputClass } from './ui'

/** Firmaprofil: navn, avdeling, logo, verneombud, leder og liste over ansvarlige. */
export function OrgForm({ settings }: { settings: OrgSettings }) {
  const file = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [newResp, setNewResp] = useState('')

  const upload = async (files: FileList | null) => {
    const f = files?.[0]
    if (!f) return
    setBusy(true)
    try {
      await saveSettings({ logo: await compressImage(f, 512, 0.92, 'image/png') })
    } finally {
      setBusy(false)
      if (file.current) file.current.value = ''
    }
  }

  const addResp = () => {
    const v = newResp.trim()
    if (!v) return
    saveSettings({ responsibles: [...settings.responsibles, v] })
    setNewResp('')
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex items-center gap-4">
        <Logo settings={settings} size={76} className="!rounded-2xl" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="font-bold text-slate-900 dark:text-white">Firmalogo</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Vises i appen og øverst i PDF-rapportene. PNG med gjennomsiktig bakgrunn blir finest.</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => file.current?.click()} disabled={busy}>
              <UploadSimple size={16} weight="bold" /> {busy ? 'Laster opp…' : settings.logo ? 'Bytt logo' : 'Last opp logo'}
            </Button>
            {settings.logo && (
              <Button size="sm" variant="ghost" onClick={() => saveSettings({ logo: null })}>
                Fjern
              </Button>
            )}
          </div>
        </div>
        <input ref={file} id="logo-file" type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files)} />
      </Card>

      <Field label="Firmanavn">
        <input id="org-name" className={inputClass} defaultValue={settings.companyName} placeholder="F.eks. Nordlys Logistikk AS" onBlur={(e) => saveSettings({ companyName: e.target.value.trim() })} />
      </Field>
      <Field label="Avdeling eller arbeidssted">
        <input id="org-dept" className={inputClass} defaultValue={settings.department} placeholder="F.eks. Terminal Nord" onBlur={(e) => saveSettings({ department: e.target.value.trim() })} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ditt navn (verneombud)">
          <input id="org-inspector" className={inputClass} defaultValue={settings.inspectorName} placeholder="F.eks. Ola Nordmann" onBlur={(e) => saveSettings({ inspectorName: e.target.value.trim() })} />
        </Field>
        <Field label="Leder / HMS-ansvarlig">
          <input id="org-manager" className={inputClass} defaultValue={settings.managerName} placeholder="F.eks. Kari Hansen" onBlur={(e) => saveSettings({ managerName: e.target.value.trim() })} />
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Personer som kan få ansvar for avvik</span>
        {settings.responsibles.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {settings.responsibles.map((r, i) => (
              <li key={`${r}-${i}`} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white py-1 pl-3 pr-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                {r}
                <button
                  type="button"
                  aria-label={`Fjern ${r}`}
                  onClick={() => saveSettings({ responsibles: settings.responsibles.filter((_, k) => k !== i) })}
                  className="grid h-6 w-6 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-red-500 dark:hover:bg-slate-700"
                >
                  <X size={12} weight="bold" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            addResp()
          }}
        >
          <input id="org-resp" className={inputClass} value={newResp} onChange={(e) => setNewResp(e.target.value)} placeholder="F.eks. Per Berg (skiftleder)" />
          <Button type="submit" className={cx('!w-12 shrink-0 !px-0')} disabled={!newResp.trim()} aria-label="Legg til person">
            <Plus size={20} weight="bold" />
          </Button>
        </form>
      </div>
    </div>
  )
}
