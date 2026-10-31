import { ask } from './ConfirmDialog'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { useBlobUrl } from '../lib/useBlobUrl'
import { db, uid } from '../db'
import { compressImage } from '../lib/image'
import { Icon } from './Icon'

function Thumb({ id, onOpen }: { id: string; onOpen: (id: string) => void }) {
  const photo = useLiveQuery(() => db.photos.get(id), [id])
  const url = useBlobUrl(photo?.blob)
  return (
    <button type="button" className="thumb" onClick={() => onOpen(id)} aria-label="Vis bilde">
      {url ? <img src={url} alt="" /> : <span className="thumb-loading" />}
    </button>
  )
}

function Lightbox({ id, onClose, onDelete }: { id: string; onClose: () => void; onDelete?: () => void }) {
  const photo = useLiveQuery(() => db.photos.get(id), [id])
  const url = useBlobUrl(photo?.blob)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="lightbox" role="dialog" aria-modal="true" onClick={onClose}>
      {url && <img src={url} alt="Bilde av avvik" onClick={(e) => e.stopPropagation()} />}
      <div className="lightbox-actions" onClick={(e) => e.stopPropagation()}>
        {onDelete && (
          <button
            type="button"
            className="btn btn-danger"
            onClick={async () => {
              if (await ask('Slette bildet?', { confirmLabel: 'Slett', danger: true })) onDelete()
            }}
          >
            Slett bilde
          </button>
        )}
        <button type="button" className="btn" onClick={onClose}>
          Lukk
        </button>
      </div>
    </div>
  )
}

interface Props {
  roundId: string
  photoIds: string[]
  onChange?: (ids: string[]) => void
}

export function Photos({ roundId, photoIds, onChange }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const add = async (files: FileList | null) => {
    if (!files || !onChange) return
    setBusy(true)
    try {
      const ids: string[] = []
      for (const file of Array.from(files)) {
        const blob = await compressImage(file)
        const id = uid()
        await db.photos.add({ id, roundId, blob, createdAt: Date.now() })
        ids.push(id)
      }
      onChange([...photoIds, ...ids])
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  const remove = async (id: string) => {
    if (!onChange) return
    onChange(photoIds.filter((p) => p !== id))
    await db.photos.delete(id)
    setOpen(null)
  }

  return (
    <div className="photos">
      {photoIds.map((id) => (
        <Thumb key={id} id={id} onOpen={setOpen} />
      ))}
      {onChange && (
        <>
          <button type="button" className="thumb thumb-add" onClick={() => input.current?.click()} disabled={busy}>
            <Icon name="camera" size={24} stroke={1.8} />
            <span>{busy ? 'Lagrer…' : 'Bilde'}</span>
          </button>
          <input ref={input} type="file" accept="image/*" capture="environment" multiple hidden onChange={(e) => add(e.target.files)} />
        </>
      )}
      {open && <Lightbox id={open} onClose={() => setOpen(null)} onDelete={onChange ? () => remove(open) : undefined} />}
    </div>
  )
}
