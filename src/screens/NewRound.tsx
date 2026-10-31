import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Header } from '../components/Header'
import { db } from '../db'
import { formatDate } from '../lib/format'
import { go } from '../lib/router'
import { startRound } from '../lib/rounds'
import { createTemplate } from '../lib/templates'

export function NewRound() {
  const templates = useLiveQuery(() => db.templates.orderBy('updatedAt').reverse().toArray(), [])
  const [templateId, setTemplateId] = useState<string>('')
  const [title, setTitle] = useState(() => `Vernerunde ${formatDate(Date.now())}`)
  const [location, setLocation] = useState('')
  const [participants, setParticipants] = useState('')

  const selected = templates?.find((t) => t.id === templateId) ?? templates?.[0]

  const start = async () => {
    if (!selected) return
    const r = await startRound(selected, title.trim() || 'Vernerunde', location.trim(), participants.trim())
    go(`/runde/${r.id}`)
  }

  return (
    <>
      <Header title="Ny vernerunde" back="/" />
      <main className="content">
        <h2 className="section-title">Velg sjekkliste</h2>
        {templates?.length === 0 && (
          <div className="empty">
            <p>Du har ingen sjekklister ennå.</p>
            <button type="button" className="btn btn-primary" onClick={createTemplate}>
              Lag sjekkliste
            </button>
          </div>
        )}
        <div className="choice-list">
          {templates?.map((t) => (
            <label key={t.id} className={`choice ${selected?.id === t.id ? 'selected' : ''}`}>
              <input type="radio" name="template" checked={selected?.id === t.id} onChange={() => setTemplateId(t.id)} />
              <span>
                <strong>{t.name}</strong>
                <span className="muted small">
                  {t.areas.length} områder · {t.areas.reduce((n, a) => n + a.checkpoints.length, 0)} punkter
                </span>
              </span>
            </label>
          ))}
        </div>

        <h2 className="section-title">Om runden</h2>
        <label className="field">
          <span className="field-label">Tittel</span>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Sted eller avdeling</span>
          <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="F.eks. Terminal Nord, 2. etasje" />
        </label>
        <label className="field">
          <span className="field-label">Deltakere</span>
          <input className="input" value={participants} onChange={(e) => setParticipants(e.target.value)} placeholder="F.eks. verneombud, leder" />
        </label>

        <button type="button" className="btn btn-primary btn-block btn-large" onClick={start} disabled={!selected}>
          Start runden
        </button>
      </main>
    </>
  )
}
