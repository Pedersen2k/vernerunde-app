import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { collectDeviations, dueFor, dueLabel, fromDateInput, isOverdue, SEVERITY, toDateInput } from '../lib/deviations'
import { formatDate } from '../lib/format'
import type { Deviation, Severity } from '../types'
import { Icon } from './Icon'

/** Tidligere brukte ansvarlige, som forslag i feltet. */
function useResponsibleSuggestions() {
  return useLiveQuery(async () => {
    const rounds = await db.rounds.toArray()
    const names = new Set(collectDeviations(rounds).map((d) => d.deviation.responsible.trim()).filter(Boolean))
    return [...names].sort((a, b) => a.localeCompare(b, 'nb'))
  }, [])
}

export function SeverityChip({ severity }: { severity: Severity }) {
  return <span className={`sev sev-${severity}`}>{SEVERITY[severity].label}</span>
}

export function DueChip({ deviation }: { deviation: Deviation }) {
  if (deviation.resolvedAt) {
    return (
      <span className="due due-done">
        <Icon name="check" size={14} stroke={2.6} /> Utbedret {formatDate(deviation.resolvedAt)}
      </span>
    )
  }
  return (
    <span className={`due ${isOverdue(deviation) ? 'due-late' : ''}`}>
      <Icon name="calendar" size={14} /> {dueLabel(deviation)}
    </span>
  )
}

interface Props {
  itemId: string
  deviation: Deviation
  locked: boolean
  onChange: (d: Deviation) => void
}

export function DeviationEditor({ itemId, deviation, locked, onChange }: Props) {
  const suggestions = useResponsibleSuggestions()

  if (locked) {
    return (
      <div className="deviation-summary">
        <SeverityChip severity={deviation.severity} />
        <DueChip deviation={deviation} />
        {deviation.responsible && (
          <span className="due">
            <Icon name="users" size={14} /> {deviation.responsible}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="deviation-editor">
      <div className="field">
        <span className="field-label">Alvorlighetsgrad</span>
        <div className="seg" role="radiogroup" aria-label="Alvorlighetsgrad">
          {(Object.keys(SEVERITY) as Severity[]).map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={deviation.severity === s}
              className={`seg-btn seg-${s} ${deviation.severity === s ? 'on' : ''}`}
              onClick={() => onChange({ ...deviation, severity: s, due: dueFor(s) })}
            >
              <strong>{SEVERITY[s].label}</strong>
              <span>{SEVERITY[s].hint}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="deviation-grid">
        <label className="field">
          <span className="field-label">Frist</span>
          <input
            id={`due-${itemId}`}
            type="date"
            className="input"
            value={toDateInput(deviation.due)}
            onChange={(e) => e.target.value && onChange({ ...deviation, due: fromDateInput(e.target.value) })}
          />
        </label>
        <label className="field">
          <span className="field-label">Ansvarlig</span>
          <input
            id={`resp-${itemId}`}
            className="input"
            list={`resp-list-${itemId}`}
            defaultValue={deviation.responsible}
            placeholder="Navn eller rolle"
            onBlur={(e) => e.target.value.trim() !== deviation.responsible && onChange({ ...deviation, responsible: e.target.value.trim() })}
          />
          <datalist id={`resp-list-${itemId}`}>
            {suggestions?.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </label>
      </div>
    </div>
  )
}
