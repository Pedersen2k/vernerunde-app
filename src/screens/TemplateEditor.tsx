import { ask } from '../components/ConfirmDialog'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { Header } from '../components/Header'
import { db, uid } from '../db'
import { go } from '../lib/router'
import type { Template, TemplateArea } from '../types'

function move<T>(list: T[], index: number, delta: number): T[] {
  const to = index + delta
  if (to < 0 || to >= list.length) return list
  const copy = [...list]
  const [item] = copy.splice(index, 1)
  copy.splice(to, 0, item)
  return copy
}

function AreaEditor({
  area,
  index,
  count,
  onChange,
  onMove,
  onDelete,
}: {
  area: TemplateArea
  index: number
  count: number
  onChange: (a: TemplateArea) => void
  onMove: (delta: number) => void
  onDelete: () => void
}) {
  const [newPoint, setNewPoint] = useState('')
  const newRef = useRef<HTMLInputElement>(null)

  const addPoint = () => {
    const text = newPoint.trim()
    if (!text) return
    onChange({ ...area, checkpoints: [...area.checkpoints, { id: uid(), text }] })
    setNewPoint('')
    newRef.current?.focus()
  }

  return (
    <section className="card area-editor">
      <div className="area-head">
        <input
          className="input input-title"
          value={area.name}
          onChange={(e) => onChange({ ...area, name: e.target.value })}
          placeholder="Navn på område, f.eks. Lager"
          aria-label="Navn på område"
        />
        <div className="area-tools">
          <button type="button" className="icon-btn small" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Flytt opp">
            ↑
          </button>
          <button type="button" className="icon-btn small" onClick={() => onMove(1)} disabled={index === count - 1} aria-label="Flytt ned">
            ↓
          </button>
          <button
            type="button"
            className="icon-btn small danger"
            aria-label="Slett område"
            onClick={async () => {
              if (
                area.checkpoints.length === 0 ||
                (await ask(`Slette området «${area.name}» med alle punktene?`, { confirmLabel: 'Slett', danger: true }))
              )
                onDelete()
            }}
          >
            ✕
          </button>
        </div>
      </div>

      <ol className="point-list">
        {area.checkpoints.map((c, i) => (
          <li key={c.id}>
            <input
              className="input"
              value={c.text}
              aria-label={`Kontrollpunkt ${i + 1}`}
              onChange={(e) =>
                onChange({
                  ...area,
                  checkpoints: area.checkpoints.map((p) => (p.id === c.id ? { ...p, text: e.target.value } : p)),
                })
              }
            />
            <button
              type="button"
              className="icon-btn small"
              onClick={() => onChange({ ...area, checkpoints: move(area.checkpoints, i, -1) })}
              disabled={i === 0}
              aria-label="Flytt punkt opp"
            >
              ↑
            </button>
            <button
              type="button"
              className="icon-btn small danger"
              onClick={() => onChange({ ...area, checkpoints: area.checkpoints.filter((p) => p.id !== c.id) })}
              aria-label="Slett punkt"
            >
              ✕
            </button>
          </li>
        ))}
      </ol>

      <form
        className="add-point"
        onSubmit={(e) => {
          e.preventDefault()
          addPoint()
        }}
      >
        <input
          ref={newRef}
          className="input"
          value={newPoint}
          onChange={(e) => setNewPoint(e.target.value)}
          placeholder="Nytt kontrollpunkt"
          enterKeyHint="done"
        />
        <button type="submit" className="btn" disabled={!newPoint.trim()}>
          Legg til
        </button>
      </form>
    </section>
  )
}

function Editor({ initial }: { initial: Template }) {
  const [t, setT] = useState(initial)
  const [saved, setSaved] = useState(true)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setSaved(false)
    const timer = window.setTimeout(async () => {
      await db.templates.put({ ...t, updatedAt: Date.now() })
      setSaved(true)
    }, 400)
    return () => window.clearTimeout(timer)
  }, [t])

  const setAreas = (areas: TemplateArea[]) => setT((prev) => ({ ...prev, areas }))

  const duplicate = async () => {
    const now = Date.now()
    const id = uid()
    await db.templates.add({
      ...t,
      id,
      name: `${t.name} (kopi)`,
      createdAt: now,
      updatedAt: now,
      areas: t.areas.map((a) => ({ ...a, id: uid(), checkpoints: a.checkpoints.map((c) => ({ ...c, id: uid() })) })),
    })
    go(`/maler/${id}`)
  }

  const remove = async () => {
    if (!(await ask(`Slette sjekklisten «${t.name}»? Tidligere vernerunder beholdes.`, { confirmLabel: 'Slett', danger: true }))) return
    await db.templates.delete(t.id)
    go('/maler')
  }

  return (
    <>
      <Header title="Rediger sjekkliste" subtitle={saved ? 'Lagret' : 'Lagrer…'} back="/maler" />
      <main className="content">
        <label className="field">
          <span className="field-label">Navn på sjekklisten</span>
          <input className="input input-title" value={t.name} onChange={(e) => setT({ ...t, name: e.target.value })} />
        </label>

        <h2 className="section-title">Områder</h2>
        {t.areas.map((a, i) => (
          <AreaEditor
            key={a.id}
            area={a}
            index={i}
            count={t.areas.length}
            onChange={(na) => setAreas(t.areas.map((x) => (x.id === a.id ? na : x)))}
            onMove={(d) => setAreas(move(t.areas, i, d))}
            onDelete={() => setAreas(t.areas.filter((x) => x.id !== a.id))}
          />
        ))}

        <button
          type="button"
          className="btn btn-block"
          onClick={() => setAreas([...t.areas, { id: uid(), name: `Område ${t.areas.length + 1}`, checkpoints: [] }])}
        >
          + Legg til område
        </button>

        <div className="button-row spaced">
          <button type="button" className="btn" onClick={duplicate}>
            Lag kopi
          </button>
          <button type="button" className="btn btn-danger" onClick={remove}>
            Slett sjekkliste
          </button>
        </div>
      </main>
    </>
  )
}

export function TemplateEditor({ id }: { id: string }) {
  const t = useLiveQuery(() => db.templates.get(id).then((x) => x ?? null), [id])
  if (t === undefined) return null
  if (t === null) {
    return (
      <>
        <Header title="Fant ikke sjekklisten" back="/maler" />
        <main className="content" />
      </>
    )
  }
  return <Editor key={t.id} initial={t} />
}
