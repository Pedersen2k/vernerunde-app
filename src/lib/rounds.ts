import { db, uid } from '../db'
import type { Round, RoundArea, Template } from '../types'

export function roundStats(areas: RoundArea[]) {
  let total = 0, checked = 0, avvik = 0, ok = 0, na = 0
  for (const a of areas) {
    for (const i of a.items) {
      total++
      if (i.status) checked++
      if (i.status === 'avvik') avvik++
      if (i.status === 'ok') ok++
      if (i.status === 'na') na++
    }
  }
  return { total, checked, avvik, ok, na }
}

export async function startRound(template: Template, title: string, location: string, participants: string) {
  const round: Round = {
    id: uid(),
    templateId: template.id,
    title,
    location,
    participants,
    startedAt: Date.now(),
    finishedAt: null,
    summary: '',
    areas: template.areas.map((a) => ({
      id: uid(),
      name: a.name,
      comment: '',
      items: a.checkpoints.map((c) => ({ id: uid(), text: c.text, status: null, comment: '', photoIds: [] })),
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

export async function deleteRound(id: string) {
  await db.transaction('rw', db.rounds, db.photos, async () => {
    await db.photos.where('roundId').equals(id).delete()
    await db.rounds.delete(id)
  })
}
