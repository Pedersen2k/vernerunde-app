import { useLiveQuery } from 'dexie-react-hooks'
import { BottomNav } from '../components/BottomNav'
import { Header } from '../components/Header'
import { db } from '../db'
import { createTemplate } from '../lib/templates'

export function Templates() {
  const templates = useLiveQuery(() => db.templates.orderBy('updatedAt').reverse().toArray(), [])

  return (
    <>
      <Header title="Sjekklister" subtitle="Områder og kontrollpunkter for rundene dine" />
      <main className="content">
        <button type="button" className="btn btn-primary btn-block btn-large" onClick={createTemplate}>
          + Lag ny sjekkliste
        </button>

        {templates?.length === 0 && (
          <div className="empty">
            <h2>Ingen sjekklister</h2>
            <p>Lag en sjekkliste med områdene og punktene du vil kontrollere.</p>
          </div>
        )}

        {templates?.map((t) => {
          const points = t.areas.reduce((n, a) => n + a.checkpoints.length, 0)
          return (
            <a key={t.id} className="card card-link" href={`#/maler/${t.id}`}>
              <h3>{t.name}</h3>
              <p className="muted">
                {t.areas.length} {t.areas.length === 1 ? 'område' : 'områder'} · {points} kontrollpunkter
              </p>
            </a>
          )
        })}
      </main>
      <BottomNav active="maler" />
    </>
  )
}
