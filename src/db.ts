import Dexie, { type EntityTable } from 'dexie'
import type { OrgSettings, Photo, Round, Template } from './types'

class VernerundeDB extends Dexie {
  templates!: EntityTable<Template, 'id'>
  rounds!: EntityTable<Round, 'id'>
  photos!: EntityTable<Photo, 'id'>
  settings!: EntityTable<OrgSettings, 'key'>

  constructor() {
    super('vernerunde')
    this.version(1).stores({
      templates: 'id, updatedAt',
      rounds: 'id, startedAt, finishedAt',
      photos: 'id, roundId',
    })
    this.version(2).stores({ settings: 'key' })
    this.on('populate', (tx) => {
      tx.table('templates').add(exampleTemplate())
    })
  }
}

export const db = new VernerundeDB()

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function area(name: string, points: string[]) {
  return { id: uid(), name, checkpoints: points.map((text) => ({ id: uid(), text })) }
}

export function exampleTemplate(): Template {
  const now = Date.now()
  return {
    id: uid(),
    name: 'Eksempel: Generell vernerunde',
    createdAt: now,
    updatedAt: now,
    areas: [
      area('Rømningsveier og brannvern', [
        'Rømningsveier er frie og godt merket',
        'Nødlys og ledelys fungerer',
        'Brannslukkere er på plass og kontrollert',
        'Branndører lukker seg og er ikke blokkert',
      ]),
      area('Orden og renhold', [
        'Gulv og ganger er ryddige og uten snublefare',
        'Avfall håndteres og sorteres riktig',
        'Lagring i hyller er stabil og sikret',
      ]),
      area('Ergonomi og arbeidsplass', [
        'Arbeidsstasjoner kan tilpasses den enkelte',
        'Tunge løft unngås, eller hjelpemidler er tilgjengelige',
        'Belysningen er god nok for arbeidet',
      ]),
      area('Maskiner og utstyr', [
        'Utstyr er i god stand og kontrollert',
        'Vern og nødstopp er på plass og fungerer',
        'Opplæring og bruksanvisning er tilgjengelig',
      ]),
      area('Kjemikalier', [
        'Sikkerhetsdatablader er tilgjengelige',
        'Kjemikalier er riktig merket og lagret',
        'Nødvendig verneutstyr er tilgjengelig',
      ]),
      area('Førstehjelp og psykososialt', [
        'Førstehjelpsutstyr er komplett og lett tilgjengelig',
        'Ansatte vet hvem som har førstehjelpsopplæring',
        'Ansatte vet hvordan de melder avvik og bekymringer',
      ]),
    ],
  }
}
