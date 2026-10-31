import { BrandStyle } from './components/BrandStyle'
import { ConfirmHost } from './components/ConfirmDialog'
import { useRoute } from './lib/router'
import { useSettings } from './lib/settings'
import { Deviations } from './screens/Deviations'
import { Home } from './screens/Home'
import { NewRound } from './screens/NewRound'
import { RoundAreaScreen } from './screens/RoundAreaScreen'
import { RoundOverview } from './screens/RoundOverview'
import { RoundSummary } from './screens/RoundSummary'
import { Settings } from './screens/Settings'
import { TemplateEditor } from './screens/TemplateEditor'
import { Templates } from './screens/Templates'
import { Welcome } from './screens/Welcome'

export default function App() {
  return (
    <>
      <BrandStyle />
      <Screen />
      <ConfirmHost />
    </>
  )
}

function Screen() {
  const [a, b, c, d] = useRoute()
  const settings = useSettings()

  if (!settings) return null
  if (!settings.onboarded) return <Welcome settings={settings} />
  if (a === 'innstillinger') return <Settings />
  if (a === 'avvik') return <Deviations />
  if (a === 'maler' && b) return <TemplateEditor id={b} />
  if (a === 'maler') return <Templates />
  if (a === 'ny') return <NewRound />
  if (a === 'runde' && b && c === 'omrade' && d) return <RoundAreaScreen key={d} roundId={b} areaId={d} />
  if (a === 'runde' && b && c === 'oppsummering') return <RoundSummary id={b} />
  if (a === 'runde' && b) return <RoundOverview id={b} />
  return <Home />
}
