import { ConfirmHost } from './components/ConfirmDialog'
import { useRoute } from './lib/router'
import { Home } from './screens/Home'
import { NewRound } from './screens/NewRound'
import { RoundAreaScreen } from './screens/RoundAreaScreen'
import { RoundOverview } from './screens/RoundOverview'
import { RoundSummary } from './screens/RoundSummary'
import { TemplateEditor } from './screens/TemplateEditor'
import { Templates } from './screens/Templates'

export default function App() {
  return (
    <>
      <Screen />
      <ConfirmHost />
    </>
  )
}

function Screen() {
  const [a, b, c, d] = useRoute()

  if (a === 'maler' && b) return <TemplateEditor id={b} />
  if (a === 'maler') return <Templates />
  if (a === 'ny') return <NewRound />
  if (a === 'runde' && b && c === 'omrade' && d) return <RoundAreaScreen key={d} roundId={b} areaId={d} />
  if (a === 'runde' && b && c === 'oppsummering') return <RoundSummary id={b} />
  if (a === 'runde' && b) return <RoundOverview id={b} />
  return <Home />
}
