import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { BottomNav } from '../components/BottomNav'
import { ask } from '../components/ConfirmDialog'
import { DueChip, SeverityChip } from '../components/DeviationEditor'
import { Header } from '../components/Header'
import { Icon } from '../components/Icon'
import { Photos } from '../components/Photos'
import { db } from '../db'
import { collectDeviations, isOverdue, type DeviationRef } from '../lib/deviations'
import { mutateRound } from '../lib/rounds'

const SEV_ORDER = { kritisk: 0, middels: 1, lav: 2 }

async function setResolved(ref: DeviationRef, resolved: boolean) {
  await mutateRound(ref.round.id, (r) => {
    const item = r.areas.find((a) => a.id === ref.area.id)?.items.find((i) => i.id === ref.item.id)
    if (!item) return
    item.deviation = { ...ref.deviation, resolvedAt: resolved ? Date.now() : null }
  })
}

function DeviationCard({ d }: { d: DeviationRef }) {
  const resolved = d.deviation.resolvedAt !== null
  const late = isOverdue(d.deviation)
  return (
    <article className={`card dev-card ${late ? 'dev-late' : ''} ${resolved ? 'dev-resolved' : ''}`}>
      <div className="dev-top">
        <SeverityChip severity={d.deviation.severity} />
        <DueChip deviation={d.deviation} />
      </div>
      <h3>{d.item.text}</h3>
      {d.item.comment && <p className="comment-readonly">{d.item.comment}</p>}
      {d.item.photoIds.length > 0 && <Photos roundId={d.round.id} photoIds={d.item.photoIds} />}
      <p className="meta-line">
        <span>
          <Icon name="pin" size={14} /> {[d.round.location, d.area.name].filter(Boolean).join(' · ')}
        </span>
        <span>
          <Icon name="users" size={14} /> {d.deviation.responsible || 'Ingen ansvarlig'}
        </span>
      </p>
      <div className="dev-actions">
        <a className="link-btn" href={`#/runde/${d.round.id}/omrade/${d.area.id}`}>
          Åpne i runden
        </a>
        {resolved ? (
          <button type="button" className="btn btn-small btn-ghost" onClick={() => setResolved(d, false)}>
            Angre
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-small btn-ok"
            onClick={async () => {
              if (await ask(`Marker «${d.item.text}» som utbedret?`, { confirmLabel: 'Utbedret' })) setResolved(d, true)
            }}
          >
            <Icon name="check" size={18} stroke={2.6} />
            Utbedret
          </button>
        )}
      </div>
    </article>
  )
}

export function Deviations() {
  const rounds = useLiveQuery(() => db.rounds.toArray(), [])
  const [tab, setTab] = useState<'open' | 'done'>('open')
  const all = rounds ? collectDeviations(rounds) : []
  const open = all
    .filter((d) => d.deviation.resolvedAt === null)
    .sort((a, b) => a.deviation.due - b.deviation.due || SEV_ORDER[a.deviation.severity] - SEV_ORDER[b.deviation.severity])
  const done = all.filter((d) => d.deviation.resolvedAt !== null).sort((a, b) => b.deviation.resolvedAt! - a.deviation.resolvedAt!)
  const overdue = open.filter((d) => isOverdue(d.deviation)).length
  const list = tab === 'open' ? open : done

  return (
    <>
      <Header title="Avvik og tiltak" subtitle={overdue > 0 ? `${overdue} forfalt` : 'Oppfølging'} />
      <main className="content">
        <div className="tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'open'} className={tab === 'open' ? 'on' : ''} onClick={() => setTab('open')}>
            Åpne <span className="tab-count">{open.length}</span>
          </button>
          <button type="button" role="tab" aria-selected={tab === 'done'} className={tab === 'done' ? 'on' : ''} onClick={() => setTab('done')}>
            Utbedret <span className="tab-count">{done.length}</span>
          </button>
        </div>

        {rounds && list.length === 0 && (
          <div className="empty">
            <div className="empty-mark">
              <Icon name={tab === 'open' ? 'checkCircle' : 'warning'} size={30} />
            </div>
            <h2>{tab === 'open' ? 'Ingen åpne avvik' : 'Ingen utbedrede avvik ennå'}</h2>
            <p>{tab === 'open' ? 'Avvik du registrerer på vernerundene samles her, med frist og ansvarlig.' : 'Når et avvik er rettet, markerer du det som utbedret.'}</p>
          </div>
        )}

        {list.map((d) => (
          <DeviationCard key={`${d.round.id}-${d.item.id}`} d={d} />
        ))}
      </main>
      <BottomNav active="avvik" />
    </>
  )
}
