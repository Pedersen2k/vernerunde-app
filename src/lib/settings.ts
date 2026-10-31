import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { OrgSettings } from '../types'

export const DEFAULT_SETTINGS: OrgSettings = {
  key: 'org',
  companyName: '',
  department: '',
  inspectorName: '',
  managerName: '',
  responsibles: [],
  logo: null,
  onboarded: false,
  theme: 'dark',
}

/** Firmaprofilen. Er `undefined` mens den lastes. */
export function useSettings(): OrgSettings | undefined {
  return useLiveQuery(async () => ({ ...DEFAULT_SETTINGS, ...(await db.settings.get('org')) }), [])
}

export async function saveSettings(patch: Partial<OrgSettings>) {
  await db.transaction('rw', db.settings, async () => {
    const current = (await db.settings.get('org')) ?? DEFAULT_SETTINGS
    await db.settings.put({ ...DEFAULT_SETTINGS, ...current, ...patch, key: 'org' })
  })
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
}

/** Alle som kan få ansvar for et avvik: lista i innstillingene pluss leder og verneombud. */
export function responsibleOptions(s: OrgSettings) {
  const list = [...s.responsibles]
  if (s.managerName) list.push(`${s.managerName} (leder)`)
  if (s.inspectorName) list.push(`${s.inspectorName} (verneombud)`)
  return [...new Set(list.filter(Boolean))]
}
