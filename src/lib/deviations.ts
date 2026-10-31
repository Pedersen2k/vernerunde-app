import type { Deviation, Round, RoundArea, RoundItem, Severity } from '../types'

export const SEVERITY: Record<Severity, { label: string; days: number; hint: string }> = {
  lav: { label: 'Lav', days: 14, hint: '14 d' },
  middels: { label: 'Middels', days: 7, hint: '7 d' },
  kritisk: { label: 'Kritisk', days: 0, hint: 'Straks' },
}

export const SEV_TONE: Record<Severity, 'green' | 'amber' | 'red'> = { lav: 'green', middels: 'amber', kritisk: 'red' }

const DAY = 24 * 60 * 60 * 1000

function endOfDay(t: number) {
  const d = new Date(t)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

export function dueFor(severity: Severity, from = Date.now()) {
  return endOfDay(from + SEVERITY[severity].days * DAY)
}

export function newDeviation(severity: Severity = 'middels'): Deviation {
  return { severity, due: dueFor(severity), responsible: '', resolvedAt: null }
}

/** Antall hele dager til fristen (negativt når fristen er passert). */
export function daysLeft(due: number, now = Date.now()) {
  return Math.round((endOfDay(due) - endOfDay(now)) / DAY)
}

export function isOverdue(d: Deviation, now = Date.now()) {
  return d.resolvedAt === null && daysLeft(d.due, now) < 0
}

export function dueLabel(d: Deviation, now = Date.now()) {
  const n = daysLeft(d.due, now)
  if (n < -1) return `Forfalt for ${-n} dager siden`
  if (n === -1) return 'Forfalt i går'
  if (n === 0) return 'Frist i dag'
  if (n === 1) return 'Frist i morgen'
  return `Frist om ${n} dager`
}

export interface DeviationRef {
  round: Round
  area: RoundArea
  item: RoundItem
  deviation: Deviation
}

/** Alle avvik på tvers av runder. Eldre avvik uten oppfølgingsdata får standardverdier. */
export function collectDeviations(rounds: Round[]): DeviationRef[] {
  const out: DeviationRef[] = []
  for (const round of rounds) {
    for (const area of round.areas) {
      for (const item of area.items) {
        if (item.status !== 'avvik') continue
        const deviation = item.deviation ?? { ...newDeviation(), due: dueFor('middels', round.startedAt) }
        out.push({ round, area, item, deviation })
      }
    }
  }
  return out
}

export function deviationCounts(rounds: Round[], now = Date.now()) {
  const all = collectDeviations(rounds)
  const open = all.filter((d) => d.deviation.resolvedAt === null)
  return { open: open.length, overdue: open.filter((d) => isOverdue(d.deviation, now)).length, total: all.length }
}

/** `yyyy-mm-dd` for et datofelt. */
export function toDateInput(t: number) {
  const d = new Date(t)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function fromDateInput(v: string) {
  const [y, m, d] = v.split('-').map(Number)
  return endOfDay(new Date(y, m - 1, d).getTime())
}
