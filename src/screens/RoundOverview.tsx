import { useLiveQuery } from 'dexie-react-hooks'
import { Header } from '../components/Header'
import { Icon } from '../components/Icon'
import { ask } from '../components/ConfirmDialog'
import { Progress } from '../components/Progress'
import { Ring } from '../components/Ring'
import { db } from '../db'
import { formatDate } from '../lib/format'
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
  const nextArea = round.areas.find((a) => a.items.some((i) => !i.status))

  const remove = async () => {
    if (!(await ask(`Slette «${round.title}» med alle bilder? Dette kan ikke angres.`, { confirmLabel: 'Slett', danger: true }))) return
    await deleteRound(round.id)
    go('/')
  }

  return (
    <>
      <Header title={round.title} subtitle={round.finishedAt ? 'Fullført vernerunde' : 'Pågående vernerunde'} back="/" />
      <main className="content">
        <section className="panel overview-panel">
          <Ring value={s.checked} max={s.total} size={92} stroke={8} />
          <div className="grow overview-meta">
            {round.location && (
              <p>
                <Icon name="pin" size={16} /> {round.location}
              </p>
            )}
            <p>
              <Icon name="calendar" size={16} /> {formatDate(round.startedAt)}
            </p>
            {round.participants && (
              <p>
                <Icon name="users" size={16} /> {round.participants}
              </p>
            )}
          </div>
        </section>

        <div className="tally">
          <div className="tally-ok">
            <Icon name="checkCircle" size={20} />
            <strong>{s.ok}</strong>
            <span>OK</span>
          </div>
          <div className="tally-avvik">
            <Icon name="warning" size={20} />
            <strong>{s.avvik}</strong>
            <span>Avvik</span>
          </div>
          <div className="tally-na">
            <Icon name="minusCircle" size={20} />
            <strong>{s.na}</strong>
            <span>Ikke relevant</span>
          </div>
        </div>

        {!round.finishedAt && nextArea && (
          <a className="btn btn-primary btn-block btn-large" href={`#/runde/${round.id}/omrade/${nextArea.id}`}>
            {s.checked === 0 ? 'Start med' : 'Fortsett med'} {nextArea.name}
            <Icon name="chevron" size={20} />
          </a>
        )}

        <h2 className="section-title">Områder</h2>
        <div className="list">
          {round.areas.map((a, i) => {
            const as = roundStats([a])
            const complete = as.total > 0 && as.checked === as.total
            return (
              <a key={a.id} className="area-row" href={`#/runde/${round.id}/omrade/${a.id}`}>
                <span className={`area-num ${complete ? 'done' : ''}`}>{complete ? <Icon name="check" size={16} stroke={3} /> : i + 1}</span>
                <div className="grow">
                  <h3>{a.name}</h3>
                  <div className="area-progress">
                    <Progress value={as.checked} max={as.total} />
                    <span className="muted small tabular">
                      {as.checked}/{as.total}
                    </span>
                  </div>
                </div>
                {as.avvik > 0 && (
                  <span className="badge badge-avvik">
                    <Icon name="warning" size={14} stroke={2.4} />
                    {as.avvik}
                  </span>
                )}
                <Icon name="chevron" size={20} className="chev" />
              </a>
            )
          })}
        </div>

        <a className={`btn btn-block btn-large ${round.finishedAt || !nextArea ? 'btn-primary' : ''}`} href={`#/runde/${round.id}/oppsummering`}>
          <Icon name="report" size={20} />
          {round.finishedAt ? 'Se rapport' : 'Oppsummer og fullfør'}
        </a>

        <button type="button" className="btn btn-ghost btn-danger btn-block" onClick={remove}>
          <Icon name="trash" size={18} />
          Slett runden
        </button>
      </main>
    </>
  )
}
