import { ask } from '../components/ConfirmDialog'
import { useLiveQuery } from 'dexie-react-hooks'
import { CommentField } from '../components/CommentField'
import { Header } from '../components/Header'
import { Photos } from '../components/Photos'
import { db } from '../db'
import { formatDateTime } from '../lib/format'
import { mutateRound, roundStats } from '../lib/rounds'

export function RoundSummary({ id }: { id: string }) {
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
  const locked = round.finishedAt !== null
  const unchecked = s.total - s.checked
  const deviations = round.areas.flatMap((a) =>
    a.items.filter((i) => i.status === 'avvik').map((i) => ({ area: a, item: i })),
  )

  const finish = async () => {
    const msg =
      unchecked > 0
        ? `${unchecked} punkter er ikke sjekket. Vil du fullføre runden likevel?`
        : 'Fullføre runden? Etter dette kan den ikke endres.'
    if (!(await ask(msg, { confirmLabel: 'Fullfør' }))) return
    await mutateRound(id, (r) => {
      r.finishedAt = Date.now()
    })
  }

  const reopen = async () => {
    if (!(await ask('Åpne runden for endringer igjen?', { confirmLabel: 'Åpne' }))) return
    await mutateRound(id, (r) => {
      r.finishedAt = null
    })
  }

  return (
    <>
      <Header title="Oppsummering" subtitle={round.title} back={`/runde/${id}`} />
      <main className="content">
        <div className="card">
          <dl className="meta">
            <dt>Startet</dt>
            <dd>{formatDateTime(round.startedAt)}</dd>
            {round.location && (
              <>
                <dt>Sted</dt>
                <dd>{round.location}</dd>
              </>
            )}
            {round.participants && (
              <>
                <dt>Deltakere</dt>
                <dd>{round.participants}</dd>
              </>
            )}
            <dt>Resultat</dt>
            <dd>
              {s.ok} OK, {s.avvik} avvik, {s.na} ikke relevant
              {unchecked > 0 && `, ${unchecked} ikke sjekket`}
            </dd>
          </dl>
        </div>

        <h2 className="section-title">Avvik ({deviations.length})</h2>
        {deviations.length === 0 && <p className="muted">Ingen avvik registrert.</p>}
        {deviations.map(({ area, item }) => (
          <div key={item.id} className="card deviation">
            <a className="small" href={`#/runde/${id}/omrade/${area.id}`}>{area.name} ›</a>
            <h3>{item.text}</h3>
            {item.comment ? <p>{item.comment}</p> : <p className="muted small">Ingen kommentar</p>}
            {item.photoIds.length > 0 && <Photos roundId={id} photoIds={item.photoIds} />}
          </div>
        ))}

        <h2 className="section-title">Oppsummering</h2>
        {locked ? (
          <div className="card">
            {round.summary ? <p className="comment-readonly">{round.summary}</p> : <p className="muted">Ingen oppsummering.</p>}
          </div>
        ) : (
          <CommentField
            value={round.summary}
            rows={4}
            placeholder="Hovedinntrykk, positive funn og hva som bør følges opp"
            onSave={(v) =>
              mutateRound(id, (r) => {
                r.summary = v
              })
            }
          />
        )}

        {locked ? (
          <>
            <div className="notice">
              Runden ble fullført {formatDateTime(round.finishedAt!)}. Rapport som PDF og e-post kommer i neste versjon.
            </div>
            <button type="button" className="btn btn-block" onClick={reopen}>
              Åpne for endringer
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-primary btn-block btn-large" onClick={finish}>
            Fullfør vernerunden
          </button>
        )}
      </main>
    </>
  )
}
