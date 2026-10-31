import { Camera, CheckCircle, Image as ImageIcon, Microphone, Stop } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { db, uid } from '../db'
import { dueFor, dueLabel, newDeviation, SEVERITY } from '../lib/deviations'
import { compressImage } from '../lib/image'
import { addExtraItem, EXTRA_AREA, findItem, mutateItem } from '../lib/rounds'
import { responsibleOptions, useSettings } from '../lib/settings'
import { listen, speechSupported } from '../lib/speech'
import type { Deviation, Round, Severity } from '../types'
import { PhotoStrip } from './Photos'
import { Sheet } from './Sheet'
import { toast } from './Toast'
import { Button, cx, Field, inputClass } from './ui'

export type FindingTarget = { round: Round | null; itemId: string | null; kind: 'avvik' | 'merknad' }

/** Registrering av avvik eller merknad: bilde, beskrivelse, alvorlighetsgrad, frist og ansvarlig. */
export function FindingSheet({ target, onClose }: { target: FindingTarget | null; onClose: () => void }) {
  return (
    <Sheet
      open={target !== null}
      onClose={onClose}
      title={target ? sheetTitle(target) : ''}
      badge={
        target && (
          <span
            className={cx(
              'rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wide',
              target.kind === 'avvik' ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
            )}
          >
            {target.kind === 'avvik' ? 'Registrer avvik' : 'Registrer merknad'}
          </span>
        )
      }
    >
      {target && <FindingForm key={`${target.round?.id}-${target.itemId}-${target.kind}`} target={target} onClose={onClose} />}
    </Sheet>
  )
}

function sheetTitle(t: FindingTarget) {
  if (!t.itemId || !t.round) return 'Funn som ikke står på sjekklista'
  return findItem(t.round, t.itemId)?.item.text ?? ''
}

function FindingForm({ target, onClose }: { target: FindingTarget; onClose: () => void }) {
  const settings = useSettings()
  const existing = target.round && target.itemId ? findItem(target.round, target.itemId)?.item : undefined
  const tempRoundId = useRef(target.round?.id ?? `standalone-${uid()}`)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState(existing?.comment ?? '')
  const [photoIds, setPhotoIds] = useState<string[]>(existing?.photoIds ?? [])
  const [deviation, setDeviation] = useState<Deviation>(existing?.deviation ?? newDeviation())
  const [customResp, setCustomResp] = useState(false)
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const stopRef = useRef<(() => void) | null>(null)
  const added = useRef<string[]>([])
  const saved = useRef(false)
  const cameraInput = useRef<HTMLInputElement>(null)
  const galleryInput = useRef<HTMLInputElement>(null)
  const suggestions = useLiveQuery(async () => {
    const rounds = await db.rounds.toArray()
    const names = new Set<string>()
    for (const r of rounds) for (const a of r.areas) for (const i of a.items) if (i.deviation?.responsible) names.add(i.deviation.responsible)
    return [...names]
  }, [])

  // Bilder som ble tatt, men ikke lagret, ryddes bort når arket lukkes.
  useEffect(
    () => () => {
      stopRef.current?.()
      if (!saved.current && added.current.length) db.photos.bulkDelete(added.current)
    },
    [],
  )

  const options = settings ? [...new Set([...responsibleOptions(settings), ...(suggestions ?? [])])] : []
  const isAvvik = target.kind === 'avvik'

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    try {
      const ids: string[] = []
      for (const f of Array.from(files)) {
        const blob = await compressImage(f)
        const id = uid()
        await db.photos.add({ id, roundId: tempRoundId.current, blob, createdAt: Date.now() })
        ids.push(id)
      }
      added.current.push(...ids)
      setPhotoIds((p) => [...p, ...ids])
    } finally {
      setBusy(false)
      if (cameraInput.current) cameraInput.current.value = ''
      if (galleryInput.current) galleryInput.current.value = ''
    }
  }

  const toggleVoice = () => {
    if (listening) {
      stopRef.current?.()
      return
    }
    setListening(true)
    stopRef.current = listen(
      (text) => setComment((c) => (c ? `${c.trimEnd()} ${text}` : text.charAt(0).toUpperCase() + text.slice(1))),
      () => setListening(false),
    )
  }

  const save = async () => {
    let roundId = target.round?.id
    let itemId = target.itemId
    if (!roundId) {
      // Fritt avvik uten pågående runde: lagres som en egen, ferdig registrering.
      roundId = tempRoundId.current
      itemId = `extra-${uid()}`
      const now = Date.now()
      await db.rounds.add({
        id: roundId,
        templateId: '',
        templateName: 'Enkeltregistrering',
        title: `Enkeltregistrering – ${title.trim()}`,
        location: settings?.department ?? '',
        participants: settings?.inspectorName ?? '',
        startedAt: now,
        finishedAt: now,
        summary: '',
        signatures: {},
        areas: [{ id: uid(), name: EXTRA_AREA, comment: '', items: [{ id: itemId, text: title.trim(), status: null, comment: '', photoIds: [] }] }],
      })
    } else if (!itemId) {
      itemId = await addExtraItem(roundId, title.trim())
    }
    await mutateItem(roundId, itemId!, (i) => {
      i.status = target.kind
      i.comment = comment.trim()
      i.photoIds = photoIds
      if (isAvvik) i.deviation = deviation
    })
    saved.current = true
    toast(isAvvik ? 'Avviket er lagret' : 'Merknaden er lagret')
    onClose()
  }

  const needsTitle = !target.itemId
  const canSave = (!needsTitle || title.trim().length > 0) && (comment.trim().length > 0 || photoIds.length > 0)

  return (
    <div className="flex flex-col gap-5">
      {needsTitle && (
        <Field label="Hva gjelder det?">
          <input id="finding-title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="F.eks. Tompaller blokkerer brannslange ved port 2" autoFocus />
        </Field>
      )}

      <div className="flex flex-col gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <Camera size={18} className="text-orange-500" /> Bildebevis
        </span>
        <PhotoStrip photoIds={photoIds} onChange={setPhotoIds} />
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => cameraInput.current?.click()}
            className="flex flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-orange-400/60 bg-orange-50 px-3 py-4 text-orange-700 transition hover:bg-orange-100 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-400"
          >
            <Camera size={28} weight="duotone" />
            <span className="text-sm font-bold">{busy ? 'Lagrer…' : 'Ta bilde'}</span>
            <span className="text-xs opacity-75">Åpner kameraet</span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => galleryInput.current?.click()}
            className="flex flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-200"
          >
            <ImageIcon size={28} weight="duotone" />
            <span className="text-sm font-bold">Galleri</span>
            <span className="text-xs opacity-75">Velg bilder</span>
          </button>
        </div>
        <input ref={cameraInput} id="finding-camera" type="file" accept="image/*" capture="environment" hidden onChange={(e) => addPhotos(e.target.files)} />
        <input ref={galleryInput} id="finding-gallery" type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
        {photoIds.length > 0 && <p className="text-xs text-slate-500 dark:text-slate-400">Trykk på et bilde for å markere funnet med rød strek.</p>}
      </div>

      <Field
        label={isAvvik ? 'Beskrivelse av avvik og foreslått tiltak' : 'Beskrivelse'}
        hint={
          speechSupported() && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                toggleVoice()
              }}
              className={cx(
                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold',
                listening
                  ? 'animate-pulse border-red-400 bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400'
                  : 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-400',
              )}
            >
              {listening ? <Stop size={14} weight="fill" /> : <Microphone size={14} weight="fill" />}
              {listening ? 'Stopp' : 'Snakk inn'}
            </button>
          )
        }
      >
        <textarea
          id="finding-comment"
          rows={3}
          className={cx(inputClass, 'resize-y')}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={isAvvik ? 'Hva er galt, og hva bør gjøres?' : 'Hva bør følges med på?'}
        />
      </Field>

      {isAvvik && (
        <>
          <div className="flex flex-col gap-2">
            <span className="flex items-center justify-between text-sm font-semibold text-slate-600 dark:text-slate-300">
              Alvorlighetsgrad og frist
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{dueLabel(deviation)}</span>
            </span>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Alvorlighetsgrad">
              {(Object.keys(SEVERITY) as Severity[]).map((s) => {
                const on = deviation.severity === s
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setDeviation({ ...deviation, severity: s, due: dueFor(s) })}
                    className={cx(
                      'min-h-12 rounded-xl border px-2 text-sm font-bold transition',
                      !on && 'border-slate-200 bg-white text-slate-600 dark:border-slate-600/60 dark:bg-slate-800 dark:text-slate-300',
                      on && s === 'lav' && 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
                      on && s === 'middels' && 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
                      on && s === 'kritisk' && 'border-red-500 bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
                    )}
                  >
                    {SEVERITY[s].label} ({SEVERITY[s].hint})
                  </button>
                )
              })}
            </div>
          </div>

          <Field label="Tildel ansvarlig">
            {customResp || options.length === 0 ? (
              <input
                id="finding-responsible"
                className={inputClass}
                value={deviation.responsible}
                onChange={(e) => setDeviation({ ...deviation, responsible: e.target.value })}
                placeholder="Navn og rolle, f.eks. Per Berg (skiftleder)"
              />
            ) : (
              <select
                id="finding-responsible"
                className={inputClass}
                value={deviation.responsible}
                onChange={(e) => {
                  if (e.target.value === '__annen') {
                    setCustomResp(true)
                    setDeviation({ ...deviation, responsible: '' })
                  } else setDeviation({ ...deviation, responsible: e.target.value })
                }}
              >
                <option value="">Velg ansvarlig…</option>
                {options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
                <option value="__annen">Annen person…</option>
              </select>
            )}
          </Field>
        </>
      )}

      <Button variant={isAvvik ? 'danger' : 'primary'} size="lg" block disabled={!canSave} onClick={save}>
        <CheckCircle size={22} weight="bold" />
        {target.itemId ? 'Lagre og knytt til sjekkpunkt' : 'Lagre funn'}
      </Button>
      {!canSave && <p className="-mt-3 text-center text-xs text-slate-500">Legg til beskrivelse eller bilde{needsTitle ? ', og hva det gjelder' : ''}.</p>}
    </div>
  )
}
