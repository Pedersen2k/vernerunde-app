import { BottomNav } from '../components/BottomNav'
import { Header } from '../components/Header'
import { OrgForm } from '../components/OrgForm'
import { useSettings } from '../lib/settings'

export function Settings() {
  const settings = useSettings()
  return (
    <>
      <Header title="Firmaprofil" subtitle="Innstillinger" />
      <main className="content">
        {settings && <OrgForm key={settings.onboarded ? 'a' : 'b'} settings={settings} />}
        <div className="notice">
          <strong>Dine data</strong>
          <p>Alt du registrerer lagres bare på denne enheten. Synkronisering mellom enheter kommer i en senere versjon.</p>
        </div>
        <p className="muted small center">Vernerunde · versjon 0.2</p>
      </main>
      <BottomNav active="innstillinger" />
    </>
  )
}
