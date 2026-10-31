import { db, uid } from '../db'
import { go } from './router'

export async function createTemplate() {
  const now = Date.now()
  const id = uid()
  await db.templates.add({
    id,
    name: 'Ny sjekkliste',
    createdAt: now,
    updatedAt: now,
    areas: [{ id: uid(), name: 'Område 1', checkpoints: [] }],
  })
  go(`/maler/${id}`)
}
