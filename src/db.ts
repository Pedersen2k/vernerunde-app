import Dexie, { type EntityTable } from 'dexie'
import type { OrgSettings, Photo, Round, Template } from './types'
import { seedTemplates } from './lib/templates'

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
      tx.table('templates').bulkAdd(seedTemplates())
    })
  }
}

export const db = new VernerundeDB()

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}
