import { db, uid } from '../db'
import type { Round, RoundArea, RoundItem, Template } from '../types'
import { formatDate } from './format'

export function roundStats(areas: RoundArea[]) {
  let total = 0, checked = 0, avvik = 0, ok = 0, na = 0, merknad = 0
  for (const a of areas) {
    for (const i of a.items) {
      total++
      if (i.status) checked++
      if (i.status === 'avvik') avvik++
      if (i.status === 'ok') ok++
      if (i.status === 'na') na++
      if (i.status === 'merknad') merknad++
    }
  }
  const relevant = checked - na
  const score = relevant === 0 ? 100 : Math.round((ok / relevant) * 100)
  return { total, checked, avvik, ok, na, merknad, score }
}

export async function startRound(template: Template, opts: { title?: string; location?: string; participants?: string } = {}) {
  const round: Round = {
    id: uid(),
    templateId: template.id,
    templateName: template.name,
    title: opts.title || `${template.name} – ${formatDate(Date.now())}`,
    location: opts.location ?? '',
    participants: opts.participants ?? '',
    startedAt: Date.now(),
    finishedAt: null,
    summary: '',
    signatures: {},
    areas: template.areas.map((a) => ({
      id: uid(),
      name: a.name,
      comment: '',
      items: a.checkpoints.map((c) => ({ id: uid(), text: c.text, law: c.law, status: null, comment: '', photoIds: [] })),
    })),
  }
  await db.rounds.add(round)
  return round
}

/** Oppdaterer en runde i en transaksjon, slik at samtidige endringer ikke overskriver hverandre. */
export async function mutateRound(id: string, fn: (r: Round) => void) {
  await db.transaction('rw', db.rounds, async () => {
    const r = await db.rounds.get(id)
    if (!r) return
    fn(r)
    await db.rounds.put(r)
  })
}

export async function mutateItem(roundId: string, itemId: string, fn: (i: RoundItem) => void) {
  await mutateRound(roundId, (r) => {
    for (const a of r.areas) {
      const i = a.items.find((x) => x.id === itemId)
      if (i) fn(i)
    }
  })
}

export function findItem(round: Round, itemId: string) {
  for (const area of round.areas) {
    const item = area.items.find((i) => i.id === itemId)
    if (item) return { area, item }
  }
  return null
}

export const EXTRA_AREA = 'Andre funn'

/** Legger til et fritt punkt (f.eks. et avvik som ikke står på sjekklista) og returnerer id-en. */
export async function addExtraItem(roundId: string, text: string) {
  const id = `extra-${uid()}`
  await mutateRound(roundId, (r) => {
    let area = r.areas.find((a) => a.name === EXTRA_AREA)
    if (!area) {
      area = { id: uid(), name: EXTRA_AREA, comment: '', items: [] }
      r.areas.push(area)
    }
    area.items.push({ id, text, status: null, comment: '', photoIds: [] })
  })
  return id
}

export async function deleteRound(id: string) {
  await db.transaction('rw', db.rounds, db.photos, async () => {
    await db.photos.where('roundId').equals(id).delete()
    await db.rounds.delete(id)
  })
}

export async function activeRound() {
  const rounds = await db.rounds.orderBy('startedAt').reverse().toArray()
  return rounds.find((r) => !r.finishedAt) ?? null
}
