import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { db } from '../db'
import type { OrgSettings, Round, RoundItem, Template } from '../types'
import { deleteRound, mutateRound, roundStats, startRound } from './rounds'
import { saveSettings, useSettings } from './settings'

/** Alle sjekklister i stabil rekkefølge: de som fulgte med først, egne til slutt. */
export async function listTemplates() {
  const all = await db.templates.toArray()
  return all.sort((a, b) => a.createdAt - b.createdAt)
}

export async function findActiveRound(templateId: string) {
  return (await db.rounds.orderBy('startedAt').reverse().filter((r) => r.templateId === templateId && !r.finishedAt).first()) ?? null
}

/** Finner pågående runde for sjekklista, eller starter en ny. Trygg mot dobbeltkall. */
export async function ensureRound(template: Template, settings?: OrgSettings): Promise<Round> {
  return db.transaction('rw', db.rounds, async () => {
    const existing = await findActiveRound(template.id)
    if (existing) return existing
    return startRound(template, {
      location: settings?.department ?? '',
      participants: settings?.inspectorName ? `${settings.inspectorName} (verneombud)` : '',
    })
  })
}

/** Forkaster pågående runde og starter en ny og tom runde fra sjekklista. */
export async function restartRound(round: Round, settings?: OrgSettings) {
  const template = await db.templates.get(round.templateId)
  await deleteRound(round.id)
  if (template) await ensureRound(template, settings)
}

/** Valgt sjekkliste og pågående runde. Runden startes automatisk når den mangler. */
export function useInspect() {
  const settings = useSettings()
  const templates = useLiveQuery(listTemplates, [])
  const template = templates ? (templates.find((t) => t.id === settings?.currentTemplateId) ?? templates[0] ?? null) : undefined
  const round = useLiveQuery(async () => (template ? await findActiveRound(template.id) : null), [template?.id])

  useEffect(() => {
    if (template && settings && round === null) void ensureRound(template, settings)
  }, [template, settings, round])

  return { settings, templates, template, round }
}

export function selectTemplate(id: string) {
  return saveSettings({ currentTemplateId: id })
}

export type FlatItem = { area: string; item: RoundItem; index: number }

export function flattenItems(round: Round): FlatItem[] {
  const out: FlatItem[] = []
  for (const a of round.areas) for (const item of a.items) out.push({ area: a.name, item, index: out.length })
  return out
}

/** Åpner en fullført runde for endringer. Mislykkes hvis en annen runde av samme liste allerede er påbegynt. */
export async function reopenRound(round: Round) {
  const other = await findActiveRound(round.templateId)
  if (other) {
    if (roundStats(other.areas).checked > 0) return false
    await deleteRound(other.id)
  }
  await mutateRound(round.id, (r) => void (r.finishedAt = null))
  return true
}
