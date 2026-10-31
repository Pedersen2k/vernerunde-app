import { useLiveQuery } from 'dexie-react-hooks'
import { Header } from '../components/Header'
import { Progress } from '../components/Progress'
import { db } from '../db'
import { formatDateTime } from '../lib/format'
import { go } from '../lib/router'
import { deleteRound, roundStats } from '../lib/rounds'

export function RoundOverview({ id }: { id: string }) {
  const round = useLiveQuery(() => db.rounds.get(id).then((r) => r ?? null), [id])
  if (round === undefined) return null
  if (round === null) {
    return (
      <>
        <Header title="Fant ikke runden" back="/" />
        <main className="content" />
      </>
    )
  }

  const s = roundStats(round.areas)

  const remove = async () => {
    if (!confirm(`Slette «${round.title}» med alle bilder? Dette kan ikke angres.`)) return
    await deleteRound(round.id)
    go('/')
  }

  return (
    <>
      <Header title={round.title} subtitle={round.location || formatDateTime(round.startedAt)} back="/" />
      <main className="content">
        <div className="card stats">
          <div className="stat-grid">
            <div>
              <strong>{s.checked}/{s.total}</strong>
              <span>sjekket</span>
            </div>
            <div className="stat-ok">
              <strong>{s.ok}</strong>
              <span>OK</span>
            </div>
            <div className="stat-avvik">
              <strong>{s.avvik}</strong>
              <span>avvik</span>
            </div>
            <div>
              <strong>{s.na}</strong>
              <span>ikke relevant</span>
            </div>
          </div>
          <Progress value={s.checked} max={s.total} />
          {round.finishedAt && <p className="muted small">Fullført {formatDateTime(round.finishedAt)}</p>}
        </div>

        <h2 className="section-title">Områder</h2>
        {round.areas.map((a) => {
          const as = roundStats([a])
          const complete = as.total > 0 && as.checked === as.total
          return (
            <a key={a.id} className="card card-link area-card" href={`#/runde/${round.id}/omrade/${a.id}`}>
              <span className={`check-dot ${complete ? 'done' : ''}`} aria-hidden="true">
                {complete ? '✓' : ''}
              </span>
              <div className="grow">
                <h3>{a.name}</h3>
                <p className="muted small">
                  {as.checked} av {as.total} sjekket
                </p>
              </div>
              {as.avvik > 0 && <span className="badge badge-avvik">{as.avvik} avvik</span>}
              <span className="chev" aria-hidden="true">›</span>
            </a>
          )
        })}

        <a className="btn btn-primary btn-block btn-large" href={`#/runde/${round.id}/oppsummering`}>
          {round.finishedAt ? 'Se oppsummering' : 'Oppsummer og fullfør'}
        </a>

        <button type="button" className="btn btn-danger btn-block spaced" onClick={remove}>
          Slett runden
        </button>
      </main>
    </>
  )
}
