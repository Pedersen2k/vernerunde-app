import { ArrowDown, ArrowUp, CaretRight, Copy, Lightning, Plus, Scales, Trash, X } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { AppShell } from '../components/AppShell'
import { ask } from '../components/ConfirmDialog'
import { toast } from '../components/Toast'
import { Button, Card, cx, Field, inputClass } from '../components/ui'
import { db, uid } from '../db'
import { listTemplates } from '../lib/inspect'
import { go } from '../lib/router'
import { saveSettings, useSettings } from '../lib/settings'
import { createTemplate, removeTemplate, TEMPLATE_EMOJI } from '../lib/templates'
import type { Template, TemplateArea, TemplateCheckpoint, TemplateIcon } from '../types'

function QuickTags() {
  const settings = useSettings()
  const [tag, setTag] = useState('')
  if (!settings) return null
  const add = () => {
    const v = tag.trim()
    if (!v || settings.quickTags.includes(v)) return
    saveSettings({ quickTags: [...settings.quickTags, v] })
    setTag('')
  }
  return (
    <Card className="flex flex-col gap-3">
      <div>
        <h2 className="flex items-center gap-2 font-display text-[0.95rem] font-extrabold text-slate-900 dark:text-white">
          <Lightning size={18} weight="fill" className="text-orange-500" /> Hurtig-etiketter
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Brukes i «Kamera-først» og som hurtigtekst når du registrerer avvik.</p>
      </div>
      <div className="flex gap-2">
        <input
          id="new-tag"
          className={inputClass}
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Ny etikett, f.eks. Defekt jekketralle"
        />
        <Button variant="primary" onClick={add} disabled={!tag.trim()} aria-label="Legg til etikett">
          <Plus size={18} weight="bold" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {settings.quickTags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-slate-100 py-1 pl-2.5 pr-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-cardElevated dark:text-slate-300">
            {t}
            <button type="button" aria-label={`Fjern ${t}`} onClick={() => saveSettings({ quickTags: settings.quickTags.filter((x) => x !== t) })} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700">
              <X size={14} weight="bold" />
            </button>
          </span>
        ))}
        {settings.quickTags.length === 0 && <p className="text-xs text-slate-500">Ingen etiketter. Legg til de vanligste funnene dine.</p>}
      </div>
    </Card>
  )
}

export function TemplatesScreen() {
  const templates = useLiveQuery(listTemplates, [])
  return (
    <AppShell tab="maler">
      <div>
        <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-orange-600 dark:text-orange-400">Tilpass</p>
        <h1 className="font-display text-xl font-extrabold text-slate-900 dark:text-white">Sjekklister og soner</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Bransjemaler og dine egne sjekklister. Endringer lagres på telefonen og vises i alle tre visningene.</p>
      </div>
      <Button variant="primary" size="lg" block onClick={createTemplate}>
        <Plus size={22} weight="bold" /> Lag ny sjekkliste
      </Button>
      <Card className="!p-0">
        <ul className="divide-y divide-slate-200 dark:divide-slate-700/60">
          {templates?.map((t) => {
            const points = t.areas.reduce((n, a) => n + a.checkpoints.length, 0)
            return (
              <li key={t.id} className="flex items-center hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <a href={`#/maler/${t.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-3.5 pl-4 no-underline">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-xl dark:bg-slate-700/60">{TEMPLATE_EMOJI[t.icon ?? 'annet']}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-slate-900 dark:text-white">{t.name}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      {t.areas.length} {t.areas.length === 1 ? 'sone' : 'soner'} · {points} sjekkpunkter
                    </span>
                  </span>
                  <CaretRight size={18} className="text-slate-400" />
                </a>
                <button
                  type="button"
                  aria-label={`Slett ${t.name}`}
                  onClick={async () => {
                    if (!(await ask(`Slette «${t.name}»? Pågående runde på lista forsvinner. Fullførte rapporter beholdes.`, { confirmLabel: 'Slett', danger: true }))) return
                    await removeTemplate(t.id)
                    toast('Sjekklisten er slettet')
                  }}
                  className="mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                >
                  <Trash size={18} />
                </button>
              </li>
            )
          })}
        </ul>
      </Card>
      <QuickTags />
    </AppShell>
  )
}

function move<T>(list: T[], i: number, d: number): T[] {
  const to = i + d
  if (to < 0 || to >= list.length) return list
  const c = [...list]
  const [x] = c.splice(i, 1)
  c.splice(to, 0, x)
  return c
}

const iconBtn = 'grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-700'

function PointRow({ p, i, onChange, onMove, onDelete }: { p: TemplateCheckpoint; i: number; onChange: (p: TemplateCheckpoint) => void; onMove: (d: number) => void; onDelete: () => void }) {
  const [lawOpen, setLawOpen] = useState(!!p.law)
  return (
    <li className="flex gap-2">
      <span className="w-5 shrink-0 pt-2.5 text-xs font-bold tabular-nums text-slate-400">{i + 1}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <textarea
          id={`p-${p.id}`}
          rows={2}
          className={cx(inputClass, '!min-h-0 resize-none !py-2 leading-snug')}
          value={p.text}
          onChange={(e) => onChange({ ...p, text: e.target.value })}
          aria-label={`Sjekkpunkt ${i + 1}`}
        />
        <div className="flex items-center gap-1">
          {lawOpen ? (
            <input
              id={`law-${p.id}`}
              className={cx(inputClass, '!min-h-9 min-w-0 flex-1 !py-1.5 text-xs')}
              value={p.law ?? ''}
              placeholder="Lovhenvisning, f.eks. Arbeidsmiljøloven § 4-4"
              onChange={(e) => onChange({ ...p, law: e.target.value || undefined })}
            />
          ) : (
            <span className="flex-1" />
          )}
          <button type="button" className={cx(iconBtn, lawOpen && 'text-orange-500')} onClick={() => setLawOpen((v) => !v)} aria-label="Lovhenvisning" aria-pressed={lawOpen}>
            <Scales size={18} />
          </button>
          <button type="button" className={iconBtn} onClick={() => onMove(-1)} disabled={i === 0} aria-label="Flytt opp">
            <ArrowUp size={16} />
          </button>
          <button type="button" className={cx(iconBtn, 'text-red-500 dark:text-red-400')} onClick={onDelete} aria-label="Slett punkt">
            <X size={16} />
          </button>
        </div>
      </div>
    </li>
  )
}

function AreaEditor({ area, index, count, onChange, onMove, onDelete }: { area: TemplateArea; index: number; count: number; onChange: (a: TemplateArea) => void; onMove: (d: number) => void; onDelete: () => void }) {
  const [text, setText] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  const add = () => {
    if (!text.trim()) return
    onChange({ ...area, checkpoints: [...area.checkpoints, { id: uid(), text: text.trim() }] })
    setText('')
    ref.current?.focus()
  }
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <input id={`a-${area.id}`} className={cx(inputClass, 'min-w-0 font-bold')} value={area.name} onChange={(e) => onChange({ ...area, name: e.target.value })} aria-label="Navn på sone" placeholder="Navn på sone, f.eks. Varemottak" />
        <button type="button" className={iconBtn} onClick={() => onMove(-1)} disabled={index === 0} aria-label="Flytt sone opp">
          <ArrowUp size={18} />
        </button>
        <button type="button" className={iconBtn} onClick={() => onMove(1)} disabled={index === count - 1} aria-label="Flytt sone ned">
          <ArrowDown size={18} />
        </button>
        <button
          type="button"
          className={cx(iconBtn, 'text-red-500 dark:text-red-400')}
          aria-label="Slett sone"
          onClick={async () => {
            if (area.checkpoints.length === 0 || (await ask(`Slette sonen «${area.name}» med alle punktene?`, { confirmLabel: 'Slett', danger: true }))) onDelete()
          }}
        >
          <Trash size={18} />
        </button>
      </div>
      <ol className="flex flex-col gap-3">
        {area.checkpoints.map((p, i) => (
          <PointRow
            key={p.id}
            p={p}
            i={i}
            onChange={(np) => onChange({ ...area, checkpoints: area.checkpoints.map((x) => (x.id === p.id ? np : x)) })}
            onMove={(d) => onChange({ ...area, checkpoints: move(area.checkpoints, i, d) })}
            onDelete={() => onChange({ ...area, checkpoints: area.checkpoints.filter((x) => x.id !== p.id) })}
          />
        ))}
      </ol>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        <input ref={ref} id={`new-${area.id}`} className={inputClass} value={text} onChange={(e) => setText(e.target.value)} placeholder="Nytt sjekkpunkt" enterKeyHint="done" />
        <Button type="submit" className="!w-12 shrink-0 !px-0" disabled={!text.trim()} aria-label="Legg til sjekkpunkt">
          <Plus size={20} weight="bold" />
        </Button>
      </form>
    </Card>
  )
}

function Editor({ initial }: { initial: Template }) {
  const [t, setT] = useState(initial)
  const [saved, setSaved] = useState(true)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    // oxlint-disable-next-line react/set-state-in-effect
    setSaved(false)
    const timer = window.setTimeout(async () => {
      await db.templates.put({ ...t, updatedAt: Date.now() })
      setSaved(true)
    }, 400)
    return () => window.clearTimeout(timer)
  }, [t])

  const setAreas = (areas: TemplateArea[]) => setT((p) => ({ ...p, areas }))

  return (
    <AppShell tab="maler">
      <div className="flex items-center justify-between">
        <a href="#/maler" className="text-sm font-semibold text-orange-600 dark:text-orange-500">
          ‹ Sjekklister
        </a>
        <span className="text-xs font-semibold text-slate-500">{saved ? 'Lagret' : 'Lagrer…'}</span>
      </div>
      <Field label="Navn på sjekklisten">
        <input id="t-name" className={cx(inputClass, 'text-lg font-bold')} value={t.name} onChange={(e) => setT({ ...t, name: e.target.value })} />
      </Field>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Type</span>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(TEMPLATE_EMOJI) as TemplateIcon[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={t.icon === k}
              onClick={() => setT({ ...t, icon: k })}
              className={cx(
                'flex min-h-14 flex-col items-center justify-center rounded-xl border text-xs font-semibold capitalize',
                t.icon === k ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300',
              )}
            >
              <span className="text-xl">{TEMPLATE_EMOJI[k]}</span>
              {k}
            </button>
          ))}
        </div>
      </div>
      <h2 className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Soner og sjekkpunkter</h2>
      {t.areas.map((a, i) => (
        <AreaEditor
          key={a.id}
          area={a}
          index={i}
          count={t.areas.length}
          onChange={(na) => setAreas(t.areas.map((x) => (x.id === a.id ? na : x)))}
          onMove={(d) => setAreas(move(t.areas, i, d))}
          onDelete={() => setAreas(t.areas.filter((x) => x.id !== a.id))}
        />
      ))}
      <Button block onClick={() => setAreas([...t.areas, { id: uid(), name: `Sone ${t.areas.length + 1}`, checkpoints: [] }])}>
        <Plus size={20} weight="bold" /> Legg til sone
      </Button>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          onClick={async () => {
            const now = Date.now()
            const id = uid()
            await db.templates.add({
              ...t,
              id,
              name: `${t.name} (kopi)`,
              createdAt: now,
              updatedAt: now,
              areas: t.areas.map((a) => ({ ...a, id: uid(), checkpoints: a.checkpoints.map((c) => ({ ...c, id: uid() })) })),
            })
            toast('Kopi laget')
            go(`/maler/${id}`)
          }}
        >
          <Copy size={18} /> Lag kopi
        </Button>
        <Button
          className="text-red-600 dark:text-red-400"
          onClick={async () => {
            if (!(await ask(`Slette «${t.name}»? Tidligere runder beholdes.`, { confirmLabel: 'Slett', danger: true }))) return
            await removeTemplate(t.id)
            toast('Sjekklisten er slettet')
            go('/maler')
          }}
        >
          <Trash size={18} /> Slett
        </Button>
      </div>
    </AppShell>
  )
}

export function TemplateEditorScreen({ id }: { id: string }) {
  const t = useLiveQuery(() => db.templates.get(id).then((x) => x ?? null), [id])
  if (t === undefined) return null
  if (t === null) {
    go('/maler')
    return null
  }
  return <Editor key={t.id} initial={t} />
}
