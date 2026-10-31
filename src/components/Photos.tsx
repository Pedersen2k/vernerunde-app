import { PencilSimple, Trash, X } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { db } from '../db'
import { useBlobUrl } from '../lib/useBlobUrl'
import { ask } from './ConfirmDialog'
import { PhotoAnnotator } from './PhotoAnnotator'
import { Button, cx } from './ui'

export function PhotoThumb({ id, onOpen, size = 'md' }: { id: string; onOpen?: (id: string) => void; size?: 'sm' | 'md' }) {
  const photo = useLiveQuery(() => db.photos.get(id), [id])
  const url = useBlobUrl(photo?.blob)
  return (
    <button
      type="button"
      onClick={() => onOpen?.(id)}
      aria-label="Vis bilde"
      className={cx(
        'shrink-0 overflow-hidden rounded-xl bg-slate-200 ring-1 ring-slate-200 dark:bg-slate-700 dark:ring-slate-600',
        size === 'md' ? 'h-20 w-20' : 'h-12 w-12',
      )}
    >
      {url && <img src={url} alt="" className="h-full w-full object-cover" />}
    </button>
  )
}

function Lightbox({ id, onClose, onDelete }: { id: string; onClose: () => void; onDelete?: () => void }) {
  const photo = useLiveQuery(() => db.photos.get(id), [id])
  const url = useBlobUrl(photo?.blob)
  const [annotate, setAnnotate] = useState(false)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (annotate && photo) {
    return (
      <PhotoAnnotator
        blob={photo.blob}
        onCancel={() => setAnnotate(false)}
        onSave={async (blob) => {
          await db.photos.update(id, { blob })
          setAnnotate(false)
        }}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-[55] flex animate-fade-in flex-col items-center justify-center gap-4 bg-black/90 p-4" onClick={onClose} role="dialog" aria-modal="true">
      {url && <img src={url} alt="Bilde av funn" className="max-h-[75dvh] max-w-full rounded-xl" onClick={(e) => e.stopPropagation()} />}
      <div className="flex flex-wrap justify-center gap-2" onClick={(e) => e.stopPropagation()}>
        {onDelete && (
          <>
            <Button size="sm" onClick={() => setAnnotate(true)}>
              <PencilSimple size={18} /> Marker på bildet
            </Button>
            <Button
              size="sm"
              className="text-red-600 dark:text-red-400"
              onClick={async () => {
                if (await ask('Slette bildet?', { confirmLabel: 'Slett', danger: true })) onDelete()
              }}
            >
              <Trash size={18} /> Slett
            </Button>
          </>
        )}
        <Button size="sm" onClick={onClose}>
          <X size={18} /> Lukk
        </Button>
      </div>
    </div>
  )
}

/** Viser bildene til et punkt. Med `onChange` kan bilder slettes og markeres. */
export function PhotoStrip({ photoIds, onChange, size }: { photoIds: string[]; onChange?: (ids: string[]) => void; size?: 'sm' | 'md' }) {
  const [open, setOpen] = useState<string | null>(null)
  if (photoIds.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {photoIds.map((id) => (
        <PhotoThumb key={id} id={id} onOpen={setOpen} size={size} />
      ))}
      {open && (
        <Lightbox
          id={open}
          onClose={() => setOpen(null)}
          onDelete={
            onChange
              ? async () => {
                  onChange(photoIds.filter((p) => p !== open))
                  await db.photos.delete(open)
                  setOpen(null)
                }
              : undefined
          }
        />
      )}
    </div>
  )
}
