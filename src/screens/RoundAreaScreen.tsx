import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { CommentField } from '../components/CommentField'
import { Header } from '../components/Header'
import { Icon, type IconName } from '../components/Icon'
import { Progress } from '../components/Progress'
import { Photos } from '../components/Photos'
import { DeviationEditor } from '../components/DeviationEditor'
import { db, uid } from '../db'
import { newDeviation } from '../lib/deviations'
import { mutateRound, roundStats } from '../lib/rounds'
import type { RoundArea, RoundItem, Status } from '../types'

const STATUS: { value: Status; label: string; icon: IconName }[] = [
  { value: 'ok', label: 'OK', icon: 'checkCircle' },
  { value: 'merknad', label: 'Merknad', icon: 'info' },
  { value: 'avvik', label: 'Avvik', icon: 'warning' },
  { value: 'na', label: 'Ikke relevant', icon: 'minusCircle' },
]

const PLACEHOLDER: Partial<Record<Status, string>> = {
  avvik: 'Beskriv avviket og forslag til tiltak',
  merknad: 'Hva bør følges med på?',
}

function ItemCard({
  roundId,
  item,
  index,
  locked,
  onUpdate,
  onDelete,
}: {
  roundId: string
  item: RoundItem
  index: number
  locked: boolean
  onUpdate: (fn: (i: RoundItem) => void) => void
  onDelete?: () => void
}) {
  const hasExtra = item.comment !== '' || item.photoIds.length > 0
  const [open, setOpen] = useState(false)
  const showDetails = open || hasExtra || item.status === 'avvik' || item.status === 'merknad'

  return (
    <article className={`card item item-${item.status ?? 'none'}`}>
      <div className="item-head">
        <span className="item-num">{index + 1}</span>
        <p className="item-text">{item.text}</p>
      </div>
      <div className="status-group" role="radiogroup" aria-label={`Status for ${item.text}`}>
        {STATUS.map((s) => (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={item.status === s.value}
            className={`status-btn status-${s.value} ${item.status === s.value ? 'on' : ''}`}
            disabled={locked}
            onClick={() =>
              onUpdate((i) => {
                i.status = i.status === s.value ? null : s.value
                if (i.status === 'avvik' && !i.deviation) i.deviation = newDeviation()
              })
            }
          >
            <Icon name={s.icon} size={20} stroke={2.1} />
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {showDetails ? (
        <div className="item-details">
          {locked ? (
            item.comment && <p className="comment-readonly">{item.comment}</p>
          ) : (
            <CommentField
              value={item.comment}
              placeholder={(item.status && PLACEHOLDER[item.status]) || 'Kommentar'}
              rows={2}
              onSave={(v) =>
                onUpdate((i) => {
                  i.comment = v
                })
              }
            />
          )}
          {item.status === 'avvik' && item.deviation && (
            <DeviationEditor
              itemId={item.id}
              deviation={item.deviation}
              locked={locked}
              onChange={(d) =>
                onUpdate((i) => {
                  i.deviation = d
                })
              }
            />
          )}
          <Photos
            roundId={roundId}
            photoIds={item.photoIds}
            onChange={
              locked
                ? undefined
                : (ids) =>
                    onUpdate((i) => {
                      i.photoIds = ids
                    })
            }
          />
          {onDelete && !locked && (
            <button type="button" className="link-btn danger" onClick={onDelete}>
              Fjern dette punktet
            </button>
          )}
        </div>
      ) : (
        !locked && (
          <button type="button" className="link-btn" onClick={() => setOpen(true)}>
            <Icon name="comment" size={16} /> Kommentar eller bilde
          </button>
        )
      )}
    </article>
  )
}

export function RoundAreaScreen({ roundId, areaId }: { roundId: string; areaId: string }) {
  const round = useLiveQuery(() => db.rounds.get(roundId).then((r) => r ?? null), [roundId])
  const [newPoint, setNewPoint] = useState('')
  if (round === undefined) return null
  const index = round?.areas.findIndex((a) => a.id === areaId) ?? -1
  if (!round || index < 0) {
    return (
      <>
        <Header title="Fant ikke området" back="/" />
        <main className="content" />
      </>
    )
  }
  const area = round.areas[index]
  const prev = round.areas[index - 1]
  const next = round.areas[index + 1]
  const locked = round.finishedAt !== null
  const stats = roundStats([area])

  const updateArea = (fn: (a: RoundArea) => void) =>
    mutateRound(roundId, (r) => {
      const a = r.areas.find((x) => x.id === areaId)
      if (a) fn(a)
    })

  const updateItem = (itemId: string) => (fn: (i: RoundItem) => void) =>
    updateArea((a) => {
      const i = a.items.find((x) => x.id === itemId)
      if (i) fn(i)
    })

  const addPoint = () => {
    const text = newPoint.trim()
    if (!text) return
    updateArea((a) => {
      a.items.push({ id: `extra-${uid()}`, text, status: null, comment: '', photoIds: [] })
    })
    setNewPoint('')
  }

  return (
    <>
      <Header
        title={area.name}
        subtitle={`Område ${index + 1} av ${round.areas.length}${locked ? ' · Låst' : ''}`}
        back={`/runde/${roundId}`}
      />
      <div className="subbar">
        <Progress value={stats.checked} max={stats.total} />
        <span className="tabular">
          {stats.checked}/{stats.total}
        </span>
      </div>
      <main className="content">
        {area.items.length === 0 && <p className="muted">Ingen kontrollpunkter i dette området.</p>}
        {area.items.map((item, i) => (
          <ItemCard
            key={item.id}
            roundId={roundId}
            item={item}
            index={i}
            locked={locked}
            onUpdate={updateItem(item.id)}
            onDelete={
              item.id.startsWith('extra-')
                ? () =>
                    updateArea((a) => {
                      a.items = a.items.filter((x) => x.id !== item.id)
                    })
                : undefined
            }
          />
        ))}

        {!locked && stats.checked < stats.total && (
          <button
            type="button"
            className="btn btn-block"
            onClick={() =>
              updateArea((a) => {
                for (const i of a.items) if (!i.status) i.status = 'ok'
              })
            }
          >
            <Icon name="checkCircle" size={20} />
            Merk resten som OK ({stats.total - stats.checked})
          </button>
        )}

        {!locked && (
          <form
            className="add-point card"
            onSubmit={(e) => {
              e.preventDefault()
              addPoint()
            }}
          >
            <input
              className="input"
              value={newPoint}
              onChange={(e) => setNewPoint(e.target.value)}
              placeholder="Eget punkt for denne runden"
            />
            <button type="submit" className="btn btn-icon" disabled={!newPoint.trim()} aria-label="Legg til punkt">
              <Icon name="plus" size={20} />
            </button>
          </form>
        )}

        {locked ? (
          area.comment && (
            <div className="card">
              <h3>Kommentar til området</h3>
              <p className="comment-readonly">{area.comment}</p>
            </div>
          )
        ) : (
          <CommentField
            key={area.id}
            label="Kommentar til området"
            value={area.comment}
            placeholder="Generelle observasjoner for området"
            onSave={(v) =>
              updateArea((a) => {
                a.comment = v
              })
            }
          />
        )}

        <div className="pager">
          {prev ? (
            <a className="btn" href={`#/runde/${roundId}/omrade/${prev.id}`}>
              <Icon name="back" size={18} />
              <span className="ellipsis">{prev.name}</span>
            </a>
          ) : (
            <span />
          )}
          {next ? (
            <a className="btn btn-primary" href={`#/runde/${roundId}/omrade/${next.id}`}>
              <span className="ellipsis">{next.name}</span>
              <Icon name="chevron" size={18} />
            </a>
          ) : (
            <a className="btn btn-primary" href={`#/runde/${roundId}/oppsummering`}>
              Til oppsummering
              <Icon name="chevron" size={18} />
            </a>
          )}
        </div>
      </main>
    </>
  )
}
