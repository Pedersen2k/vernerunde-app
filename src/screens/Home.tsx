import { useLiveQuery } from 'dexie-react-hooks'
import { BottomNav } from '../components/BottomNav'
import { Header } from '../components/Header'
import { Progress } from '../components/Progress'
import { db } from '../db'
import { formatDate } from '../lib/format'
import { roundStats } from '../lib/rounds'
import type { Round } from '../types'

function RoundCard({ round }: { round: Round }) {
  const s = roundStats(round.areas)
  return (
    <a className="card card-link" href={`#/runde/${round.id}`}>
      <div className="card-row">
        <div>
          <h3>{round.title}</h3>
          <p className="muted">
            {[round.location, formatDate(round.startedAt)].filter(Boolean).join(' · ')}
          </p>
        </div>
        {s.avvik > 0 && <span className="badge badge-avvik">{s.avvik} avvik</span>}
      </div>
      {!round.finishedAt && (
        <>
          <Progress value={s.checked} max={s.total} />
          <p className="muted small">
            {s.checked} av {s.total} punkter sjekket
          </p>
        </>
      )}
    </a>
  )
}

export function Home() {
  const rounds = useLiveQuery(() => db.rounds.orderBy('startedAt').reverse().toArray(), [])
  const active = rounds?.filter((r) => !r.finishedAt) ?? []
  const done = rounds?.filter((r) => r.finishedAt) ?? []

  return (
    <>
      <Header title="Vernerunder" />
      <main className="content">
        <a className="btn btn-primary btn-block btn-large" href="#/ny">
          + Start ny vernerunde
        </a>

        {rounds && rounds.length === 0 && (
          <div className="empty">
            <h2>Ingen vernerunder ennå</h2>
            <p>
              Start en ny runde med eksempelsjekklisten, eller lag din egen under <a href="#/maler">Sjekklister</a>.
            </p>
          </div>
        )}

        {active.length > 0 && (
          <section>
            <h2 className="section-title">Pågående</h2>
            {active.map((r) => (
              <RoundCard key={r.id} round={r} />
            ))}
          </section>
        )}

        {done.length > 0 && (
          <section>
            <h2 className="section-title">Fullførte</h2>
            {done.map((r) => (
              <RoundCard key={r.id} round={r} />
            ))}
          </section>
        )}

        <p className="muted small center note">Alt lagres på denne enheten og virker uten nett.</p>
      </main>
      <BottomNav active="runder" />
    </>
  )
}
