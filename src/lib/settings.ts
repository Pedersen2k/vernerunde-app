import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { OrgSettings } from '../types'

export const ACCENTS = [
  { name: 'Verngrønn', value: '#0d6b4f' },
  { name: 'Marine', value: '#1d4e89' },
  { name: 'Petrol', value: '#0e6377' },
  { name: 'Grafitt', value: '#33414d' },
  { name: 'Plomme', value: '#5b3a8c' },
  { name: 'Rust', value: '#a5481a' },
]

export const DEFAULT_SETTINGS: OrgSettings = {
  key: 'org',
  companyName: '',
  department: '',
  inspectorName: '',
  logo: null,
  accent: ACCENTS[0].value,
  onboarded: false,
}

/** Firmaprofilen. Er `undefined` mens den lastes. */
export function useSettings(): OrgSettings | undefined {
  return useLiveQuery(async () => ({ ...DEFAULT_SETTINGS, ...(await db.settings.get('org')) }), [])
}

export async function saveSettings(patch: Partial<OrgSettings>) {
  await db.transaction('rw', db.settings, async () => {
    const current = (await db.settings.get('org')) ?? DEFAULT_SETTINGS
    await db.settings.put({ ...current, ...patch, key: 'org' })
  })
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
}
