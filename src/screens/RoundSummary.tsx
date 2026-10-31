import { useLiveQuery } from 'dexie-react-hooks'
import { CommentField } from '../components/CommentField'
import { ask } from '../components/ConfirmDialog'
import { Header } from '../components/Header'
import { Icon } from '../components/Icon'
import { Logo } from '../components/Logo'
import { Photos } from '../components/Photos'
import { db } from '../db'
import { formatDate, formatDateTime } from '../lib/format'
import { mutateRound, roundStats } from '../lib/rounds'
import { useSettings } from '../lib/settings'

export function RoundSummary({ id }: { id: string }) {
  const settings = useSettings()
  const round = useLiveQuery(() => db.rounds.get(id).then((r) => r ?? null), [id])
  if (round === undefined || !settings) return null
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
        : 'Fullføre runden? Den låses for endringer.'
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
      <Header title={locked ? 'Rapport' : 'Oppsummering'} subtitle={round.title} back={`/runde/${id}`} />
      <main className="content">
        <article className="report">
          <header className="report-head">
            <Logo settings={settings} size={56} />
            <div className="grow">
              <p className="eyebrow">{settings.companyName || 'Vernerunde'}</p>
              <p className="muted small">Rapport fra vernerunde</p>
            </div>
            <span className={`stamp ${locked ? 'stamp-done' : ''}`}>{locked ? 'Fullført' : 'Utkast'}</span>
          </header>
          <h2 className="report-title">{round.title}</h2>
          <div className="hazard hazard-thin" aria-hidden="true" />

          <dl className="meta">
            <dt>Dato</dt>
            <dd>{formatDate(round.startedAt)}</dd>
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
            {round.finishedAt && (
              <>
                <dt>Fullført</dt>
                <dd>{formatDateTime(round.finishedAt)}</dd>
              </>
            )}
          </dl>

          <div className="tally tally-compact">
            <div className="tally-ok">
              <strong>{s.ok}</strong>
              <span>OK</span>
            </div>
            <div className="tally-avvik">
              <strong>{s.avvik}</strong>
              <span>Avvik</span>
            </div>
            <div className="tally-na">
              <strong>{s.na}</strong>
              <span>Ikke relevant</span>
            </div>
            <div>
              <strong>{unchecked}</strong>
              <span>Ikke sjekket</span>
            </div>
          </div>

          <h3 className="report-section">Avvik ({deviations.length})</h3>
          {deviations.length === 0 && <p className="muted">Ingen avvik registrert.</p>}
          <ol className="deviation-list">
            {deviations.map(({ area, item }) => (
              <li key={item.id} className="deviation">
                <a className="deviation-area" href={`#/runde/${id}/omrade/${area.id}`}>
                  {area.name}
                </a>
                <strong>{item.text}</strong>
                {item.comment ? <p className="comment-readonly">{item.comment}</p> : <p className="muted small">Ingen kommentar</p>}
                {item.photoIds.length > 0 && <Photos roundId={id} photoIds={item.photoIds} />}
              </li>
            ))}
          </ol>

          <h3 className="report-section">Oppsummering</h3>
          {locked ? (
            round.summary ? <p className="comment-readonly">{round.summary}</p> : <p className="muted">Ingen oppsummering.</p>
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
        </article>

        {locked ? (
          <>
            <div className="notice">
              <Icon name="report" size={18} /> Eksport til PDF og deling på e-post kommer i neste versjon.
            </div>
            <button type="button" className="btn btn-block" onClick={reopen}>
              Åpne for endringer
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-primary btn-block btn-large" onClick={finish}>
            <Icon name="check" size={20} stroke={2.6} />
            Fullfør vernerunden
          </button>
        )}
      </main>
    </>
  )
}
