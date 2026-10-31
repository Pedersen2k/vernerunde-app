import { FindingHost, ThemeSync } from './components/AppShell'
import { ConfirmHost } from './components/ConfirmDialog'
import { ToastHost } from './components/Toast'
import { useRoute } from './lib/router'
import { useSettings } from './lib/settings'
import { DeviationsScreen } from './screens/DeviationsScreen'
import { Overview } from './screens/Overview'
import { ReportScreen } from './screens/ReportScreen'
import { RoundScreen } from './screens/RoundScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { TemplateEditorScreen, TemplatesScreen } from './screens/TemplatesScreen'
import { Welcome } from './screens/Welcome'

export default function App() {
  return (
    <>
      <ThemeSync />
      <Screen />
      <FindingHost />
      <ConfirmHost />
      <ToastHost />
    </>
  )
}

function Screen() {
  const [a, b] = useRoute()
  const settings = useSettings()

  if (!settings) return null
  if (!settings.onboarded) return <Welcome settings={settings} />
  if (a === 'runde') return <RoundScreen key={b ?? 'aktiv'} id={b} />
  if (a === 'rapport') return <ReportScreen key={b ?? 'siste'} id={b} />
  if (a === 'avvik') return <DeviationsScreen />
  if (a === 'maler' && b) return <TemplateEditorScreen key={b} id={b} />
  if (a === 'maler') return <TemplatesScreen />
  if (a === 'innstillinger') return <SettingsScreen />
  return <Overview />
}
