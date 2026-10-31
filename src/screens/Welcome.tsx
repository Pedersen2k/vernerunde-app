import { Icon } from '../components/Icon'
import { OrgForm } from '../components/OrgForm'
import { saveSettings } from '../lib/settings'
import type { OrgSettings } from '../types'

export function Welcome({ settings }: { settings: OrgSettings }) {
  const finish = () => {
    // Lagre felt som fortsatt har fokus før vi går videre.
    ;(document.activeElement as HTMLElement | null)?.blur()
    setTimeout(() => saveSettings({ onboarded: true }), 0)
  }
  return (
    <div className="welcome">
      <div className="welcome-hero">
        <div className="welcome-mark">
          <Icon name="shield" size={34} />
        </div>
        <h1>Velkommen til Vernerunde</h1>
        <p>Sett opp firmaprofilen, så får rundene og rapportene dine riktig navn, logo og farge. Du kan endre dette senere.</p>
        <div className="hazard" aria-hidden="true" />
      </div>
      <main className="content">
        <OrgForm settings={settings} />
        <button type="button" className="btn btn-primary btn-block btn-large" onClick={finish}>
          Kom i gang
        </button>
        <button type="button" className="btn btn-ghost btn-block" onClick={() => saveSettings({ onboarded: true })}>
          Hopp over
        </button>
      </main>
    </div>
  )
}
