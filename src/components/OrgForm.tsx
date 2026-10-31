import { useRef, useState } from 'react'
import { compressImage } from '../lib/image'
import { ACCENTS, saveSettings } from '../lib/settings'
import type { OrgSettings } from '../types'
import { Icon } from './Icon'
import { Logo } from './Logo'

/** Skjema for firmaprofil: navn, avdeling, logo, farge og verneombudets navn. */
export function OrgForm({ settings }: { settings: OrgSettings }) {
  const file = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const upload = async (files: FileList | null) => {
    const f = files?.[0]
    if (!f) return
    setBusy(true)
    try {
      const blob = f.type === 'image/svg+xml' ? f : await compressImage(f, 512, 0.92, 'image/png')
      await saveSettings({ logo: blob })
    } finally {
      setBusy(false)
      if (file.current) file.current.value = ''
    }
  }

  return (
    <div className="org-form">
      <div className="logo-picker">
        <Logo settings={settings} size={88} className="logo-large" />
        <div className="logo-picker-text">
          <strong>Firmalogo</strong>
          <span className="muted small">Vises på forsiden og i rapportene. PNG med gjennomsiktig bakgrunn blir finest.</span>
          <div className="button-row">
            <button type="button" className="btn btn-small" onClick={() => file.current?.click()} disabled={busy}>
              <Icon name="upload" size={18} />
              {busy ? 'Laster opp…' : settings.logo ? 'Bytt logo' : 'Last opp logo'}
            </button>
            {settings.logo && (
              <button type="button" className="btn btn-small btn-ghost" onClick={() => saveSettings({ logo: null })}>
                Fjern
              </button>
            )}
          </div>
        </div>
        <input ref={file} id="logo-file" type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files)} />
      </div>

      <label className="field">
        <span className="field-label">Firmanavn</span>
        <input
          id="org-name"
          className="input"
          defaultValue={settings.companyName}
          placeholder="F.eks. Nordlys Logistikk AS"
          onBlur={(e) => saveSettings({ companyName: e.target.value.trim() })}
        />
      </label>
      <label className="field">
        <span className="field-label">Avdeling eller arbeidssted</span>
        <input
          id="org-dept"
          className="input"
          defaultValue={settings.department}
          placeholder="F.eks. Terminal Nord"
          onBlur={(e) => saveSettings({ department: e.target.value.trim() })}
        />
      </label>
      <label className="field">
        <span className="field-label">Ditt navn (verneombud)</span>
        <input
          id="org-inspector"
          className="input"
          defaultValue={settings.inspectorName}
          placeholder="Brukes som deltaker på nye runder"
          onBlur={(e) => saveSettings({ inspectorName: e.target.value.trim() })}
        />
      </label>

      <fieldset className="field accent-field">
        <legend className="field-label">Firmafarge</legend>
        <div className="swatches">
          {ACCENTS.map((a) => (
            <button
              key={a.value}
              type="button"
              className={`swatch ${settings.accent === a.value ? 'on' : ''}`}
              style={{ background: a.value }}
              onClick={() => saveSettings({ accent: a.value })}
              aria-label={a.name}
              aria-pressed={settings.accent === a.value}
              title={a.name}
            >
              {settings.accent === a.value && <Icon name="check" size={20} stroke={3} />}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  )
}
