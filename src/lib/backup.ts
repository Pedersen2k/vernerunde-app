import { db } from '../db'
import type { OrgSettings, Photo, Round, Template } from '../types'
import { seedTemplates } from './templates'

const VERSION = 1

type BlobJson = { type: string; data: string } | null

const toJson = (blob: Blob | null): Promise<BlobJson> =>
  blob
    ? new Promise((resolve, reject) => {
        const r = new FileReader()
        r.onerror = () => reject(r.error)
        r.onload = () => resolve({ type: blob.type, data: String(r.result) })
        r.readAsDataURL(blob)
      })
    : Promise.resolve(null)

const toBlob = async (j: BlobJson): Promise<Blob | null> => (j ? await (await fetch(j.data)).blob() : null)

/** Lager en komplett sikkerhetskopi (sjekklister, runder, bilder og innstillinger) som JSON. */
export async function exportBackup(): Promise<Blob> {
  const [templates, rounds, photos, settings] = await Promise.all([db.templates.toArray(), db.rounds.toArray(), db.photos.toArray(), db.settings.get('org')])
  const data = {
    app: 'vernerunde-pro',
    version: VERSION,
    exportedAt: new Date().toISOString(),
    templates,
    rounds,
    photos: await Promise.all(photos.map(async (p) => ({ ...p, blob: await toJson(p.blob) }))),
    settings: settings ? { ...settings, logo: await toJson(settings.logo) } : null,
  }
  return new Blob([JSON.stringify(data)], { type: 'application/json' })
}

/** Leser en sikkerhetskopi og erstatter alle data på enheten. Kaster feil hvis filen ikke er gyldig. */
export async function importBackup(file: File) {
  let data: { app?: string; version?: number; templates?: Template[]; rounds?: Round[]; photos?: (Omit<Photo, 'blob'> & { blob: BlobJson })[]; settings?: (Omit<OrgSettings, 'logo'> & { logo: BlobJson }) | null }
  try {
    data = JSON.parse(await file.text())
  } catch {
    throw new Error('Filen er ikke en gyldig sikkerhetskopi.')
  }
  if (data.app !== 'vernerunde-pro' || !Array.isArray(data.templates) || !Array.isArray(data.rounds) || !Array.isArray(data.photos)) {
    throw new Error('Filen er ikke en sikkerhetskopi fra Vernerunde Pro.')
  }
  const photos: Photo[] = []
  for (const p of data.photos) {
    const blob = await toBlob(p.blob)
    if (blob) photos.push({ ...p, blob })
  }
  const settings = data.settings ? ({ ...data.settings, logo: await toBlob(data.settings.logo) } as OrgSettings) : null
  await db.transaction('rw', db.templates, db.rounds, db.photos, db.settings, async () => {
    await Promise.all([db.templates.clear(), db.rounds.clear(), db.photos.clear(), db.settings.clear()])
    await db.templates.bulkAdd(data.templates!)
    await db.rounds.bulkAdd(data.rounds!)
    await db.photos.bulkAdd(photos)
    if (settings) await db.settings.put(settings)
  })
}

/** Sletter alt og starter med standard bransjemaler. */
export async function resetEverything() {
  await db.transaction('rw', db.templates, db.rounds, db.photos, db.settings, async () => {
    await Promise.all([db.templates.clear(), db.rounds.clear(), db.photos.clear(), db.settings.clear()])
    await db.templates.bulkAdd(seedTemplates())
  })
}
