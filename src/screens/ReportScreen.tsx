import { ClipboardText, DownloadSimple, FilePdf, LockOpen, NotePencil, PaperPlaneTilt, Seal, Signature as SignatureIcon, X } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { AppShell } from '../components/AppShell'
import { ask } from '../components/ConfirmDialog'
import { Logo } from '../components/Logo'
import { PhotoStrip } from '../components/Photos'
import { SignaturePad } from '../components/SignaturePad'
import { toast } from '../components/Toast'
import { Button, Card, cx, Empty, Field, inputClass, LinkButton, Pill, SectionTitle } from '../components/ui'
import { db } from '../db'
import { dueLabel, SEV_TONE, SEVERITY } from '../lib/deviations'
import { formatDate, formatDateTime } from '../lib/format'
import { reportFileName } from '../lib/reportName'
import { mutateRound, roundStats } from '../lib/rounds'
import { useSettings } from '../lib/settings'
import type { OrgSettings, Round, Status } from '../types'

const STATUS_LABEL: Record<Status, string> = { ok: 'OK', merknad: 'Merknad', avvik: 'Avvik', na: 'Ikke relevant' }
const STATUS_CLS: Record<Status, string> = {
  ok: 'bg-emerald-100 text-emerald-700',
  merknad: 'bg-amber-100 text-amber-700',
  avvik: 'bg-red-100 text-red-700',
  na: 'bg-slate-100 text-slate-500',
}

/** Tekstfelt som lagrer når man forlater feltet. */
function SaveOnBlur({ id, value, onSave, multiline, placeholder }: { id: string; value: string; onSave: (v: string) => void; multiline?: boolean; placeholder?: string }) {
  const [v, setV] = useState(value)
  const props = {
    id,
    value: v,
    placeholder,
    onChange: (e: { target: { value: string } }) => setV(e.target.value),
    onBlur: () => v !== value && onSave(v),
    className: cx(inputClass, multiline && 'resize-y'),
  }
  return multiline ? <textarea rows={4} {...props} /> : <input {...props} />
}

function PdfPreview({ round, settings, onClose }: { round: Round; settings: OrgSettings; onClose: () => void }) {
  const [busy, setBusy] = useState<'share' | 'download' | null>(null)
  const s = roundStats(round.areas)
  const filename = reportFileName(round)
  const findings = round.areas.flatMap((a) => a.items.filter((i) => i.status === 'avvik' || i.status === 'merknad').map((i) => ({ a, i })))
  let n = 0

  const run = async (kind: 'share' | 'download') => {
    setBusy(kind)
    try {
      const { buildReportPdf, downloadBlob, shareOrDownload } = await import('../lib/pdf')
      const blob = await buildReportPdf(round, settings)
      if (kind === 'download') {
        if (await downloadBlob(blob, filename)) toast('PDF-rapporten er lagret')
      } else {
        const r = await shareOrDownload(blob, filename, `Vernerunderapport: ${round.title}`)
        if (r === 'downloaded') toast('Deling støttes ikke her, så PDF-en ble lagret i stedet')
        if (r === 'shared') toast('Rapporten er delt')
      }
    } catch {
      toast('Klarte ikke å lage PDF-en. Prøv igjen.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in flex-col bg-slate-950/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-hidden p-3 pt-[calc(12px+env(safe-area-inset-top,0px))]">
        <div className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
            <FilePdf size={24} weight="fill" className="shrink-0 text-red-500" />
            <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">{filename}</p>
            <button type="button" onClick={onClose} aria-label="Lukk" className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 border-b border-slate-200 px-4 py-3">
            <Button size="sm" variant="primary" onClick={() => run('share')} disabled={busy !== null}>
              <PaperPlaneTilt size={18} weight="bold" /> {busy === 'share' ? 'Lager PDF…' : 'Del / e-post'}
            </Button>
            <Button size="sm" className="!border-slate-200 !bg-white !text-slate-800" onClick={() => run('download')} disabled={busy !== null}>
              <DownloadSimple size={18} weight="bold" /> {busy === 'download' ? 'Lager PDF…' : 'Last ned PDF'}
            </Button>
          </div>

          {/* Forhåndsvisning av rapporten, alltid lys som et papirdokument */}
          <article className="overflow-y-auto px-5 pb-8 pt-5 text-slate-900">
            <header className="flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-500">{settings.companyName || 'Vernerunde'}</p>
                <h2 className="mt-1 text-2xl font-extrabold">Vernerunderapport</h2>
                <p className="text-sm text-slate-600">{round.title}</p>
              </div>
              {settings.logo && <Logo settings={settings} size={56} />}
            </header>
            <div className="my-4 h-0.5 bg-slate-900" />
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-xl bg-slate-50 p-3 text-sm">
              <dt className="font-semibold text-slate-500">Dato</dt>
              <dd>{formatDate(round.startedAt)}</dd>
              <dt className="font-semibold text-slate-500">Sted</dt>
              <dd>{round.location || '–'}</dd>
              <dt className="font-semibold text-slate-500">Deltakere</dt>
              <dd>{round.participants || '–'}</dd>
              <dt className="font-semibold text-slate-500">Status</dt>
              <dd>{round.finishedAt ? `Fullført ${formatDateTime(round.finishedAt)}` : 'Utkast'}</dd>
            </dl>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              {[
                ['Godkjent', `${s.score}%`, 'text-emerald-600'],
                ['OK', s.ok, 'text-emerald-600'],
                ['Merknader', s.merknad, 'text-amber-600'],
                ['Avvik', s.avvik, 'text-red-600'],
              ].map(([l, v, c]) => (
                <div key={l as string} className="rounded-xl bg-slate-50 p-2">
                  <p className={cx('text-xl font-extrabold tabular-nums', c as string)}>{v}</p>
                  <p className="text-[0.68rem] font-semibold text-slate-500">{l}</p>
                </div>
              ))}
            </div>

            {findings.length > 0 && (
              <>
                <h3 className="mt-6 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Avvik og merknader</h3>
                <ol className="mt-2 flex flex-col gap-3">
                  {findings.map(({ a, i }, k) => (
                    <li key={i.id} className="flex flex-col gap-1 border-b border-slate-100 pb-3">
                      <div className="flex items-start gap-2">
                        <p className="flex-1 text-sm font-bold">
                          {k + 1}. {i.text}
                        </p>
                        <span className={cx('rounded px-1.5 py-0.5 text-[0.65rem] font-bold uppercase', STATUS_CLS[i.status!])}>{STATUS_LABEL[i.status!]}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {a.name}
                        {i.status === 'avvik' && i.deviation && ` • ${SEVERITY[i.deviation.severity].label} • Frist ${formatDate(i.deviation.due)}${i.deviation.responsible ? ` • ${i.deviation.responsible}` : ''}`}
                      </p>
                      {i.comment && <p className="text-sm text-slate-700">{i.comment}</p>}
                      <PhotoStrip photoIds={i.photoIds} size="sm" />
                    </li>
                  ))}
                </ol>
              </>
            )}

            <h3 className="mt-6 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Gjennomgåtte sjekkpunkter</h3>
            {round.areas.map((a) => (
              <div key={a.id} className="mt-3">
                <p className="text-sm font-bold">{a.name}</p>
                <ul className="divide-y divide-slate-100">
                  {a.items.map((i) => (
                    <li key={i.id} className="flex items-start gap-3 py-2 text-sm">
                      <span className="flex-1">
                        {++n}. {i.text}
                      </span>
                      <span className={cx('shrink-0 rounded px-1.5 py-0.5 text-[0.65rem] font-bold', i.status ? STATUS_CLS[i.status] : 'bg-slate-100 text-slate-400')}>
                        {i.status ? STATUS_LABEL[i.status] : 'Ikke sjekket'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {round.summary && (
              <>
                <h3 className="mt-6 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Oppsummering</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm">{round.summary}</p>
              </>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              {(
                [
                  ['Verneombud', round.signatures?.inspector],
                  ['Leder / HMS', round.signatures?.manager],
                ] as const
              ).map(([label, sig]) => (
                <div key={label} className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-500">Signatur {label.toLowerCase()}</p>
                  <div className="grid h-16 place-items-center">{sig?.image && <img src={sig.image} alt={`Signatur ${sig.name}`} className="max-h-16" />}</div>
                  <p className="border-t border-slate-200 pt-1 text-center text-xs font-bold">{sig?.name || ' '}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}

export function ReportScreen({ id }: { id?: string }) {
  const settings = useSettings()
  const [preview, setPreview] = useState(false)
  const round = useLiveQuery(async () => {
    if (id) return (await db.rounds.get(id)) ?? null
    const all = (await db.rounds.orderBy('startedAt').reverse().toArray()).filter((r) => r.templateId)
    return all.find((r) => !r.finishedAt) ?? all[0] ?? null
  }, [id])

  if (round === undefined || !settings) return <AppShell tab="rapport">{null}</AppShell>
  if (round === null) {
    return (
      <AppShell tab="rapport">
        <Empty icon={<SignatureIcon size={36} />} title="Ingen rapport ennå">
          <p>Når du har gått en vernerunde, lager du rapporten og signerer her.</p>
        </Empty>
      </AppShell>
    )
  }

  const s = roundStats(round.areas)
  const locked = round.finishedAt !== null
  const unchecked = s.total - s.checked
  const findings = round.areas.flatMap((a) => a.items.filter((i) => i.status === 'avvik' || i.status === 'merknad').map((i) => ({ a, i })))
  const update = (fn: (r: Round) => void) => mutateRound(round.id, fn)
  const inspectorName = round.signatures?.inspector?.name ?? settings.inspectorName
  const managerName = round.signatures?.manager?.name ?? settings.managerName

  const finish = async () => {
    const missing: string[] = []
    if (unchecked > 0) missing.push(`${unchecked} punkter er ikke sjekket`)
    if (!round.signatures?.inspector || !round.signatures?.manager) missing.push('rapporten er ikke signert av begge')
    const msg = missing.length ? `${missing.join(' og ')}. Vil du fullføre likevel?` : 'Fullføre runden og låse rapporten?'
    if (!(await ask(msg.charAt(0).toUpperCase() + msg.slice(1), { confirmLabel: 'Fullfør' }))) return
    await update((r) => void (r.finishedAt = Date.now()))
    toast('Vernerunden er fullført')
    setPreview(true)
  }

  return (
    <AppShell tab="rapport">
      <Card className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Resultat av vernerunde</p>
            <h1 className="mt-1 text-lg font-extrabold leading-snug text-slate-900 dark:text-white">{round.title}</h1>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{[round.location, formatDate(round.startedAt)].filter(Boolean).join(' · ')}</p>
          </div>
          <div className="shrink-0 rounded-2xl border border-emerald-500/30 bg-emerald-50 px-3 py-2 text-center dark:bg-emerald-500/10">
            <p className="text-2xl font-extrabold leading-none tabular-nums text-emerald-600 dark:text-emerald-400">{s.score}%</p>
            <p className="mt-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-500">OK</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-slate-200 pt-4 text-center dark:border-slate-700/60">
          <div className="rounded-xl bg-emerald-50 py-2.5 dark:bg-emerald-500/10">
            <p className="text-xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">{s.ok}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">Godkjent (OK)</p>
          </div>
          <div className="rounded-xl bg-amber-50 py-2.5 dark:bg-amber-500/10">
            <p className="text-xl font-extrabold tabular-nums text-amber-600 dark:text-amber-400">{s.merknad}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">Merknader</p>
          </div>
          <div className="rounded-xl bg-red-50 py-2.5 dark:bg-red-500/10">
            <p className="text-xl font-extrabold tabular-nums text-red-600 dark:text-red-400">{s.avvik}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">Avvik</p>
          </div>
        </div>
        {unchecked > 0 && !locked && <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">{unchecked} punkter er ikke sjekket ennå.</p>}
      </Card>

      <Card className="flex flex-col gap-3">
        <SectionTitle
          icon={<ClipboardText size={20} weight="bold" className="text-orange-500" />}
          action={
            !locked && (
              <a href={`#/runde/${round.id}`} className="text-sm font-semibold text-orange-600 dark:text-orange-500">
                + Endre sjekkliste
              </a>
            )
          }
        >
          Registrerte funn
        </SectionTitle>
        {findings.length === 0 && (
          <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">Ingen avvik eller merknader registrert i denne runden.</p>
        )}
        {findings.map(({ a, i }) => (
          <div key={i.id} className={cx('flex flex-col gap-1.5 rounded-xl border-l-4 p-3', i.status === 'avvik' ? 'border-red-500 bg-red-50 dark:bg-red-500/10' : 'border-amber-500 bg-amber-50 dark:bg-amber-500/10')}>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={i.status === 'avvik' ? 'red' : 'amber'}>{i.status === 'avvik' ? 'Avvik' : 'Merknad'}</Pill>
              {i.deviation && i.status === 'avvik' && (
                <>
                  <Pill tone={SEV_TONE[i.deviation.severity]}>{SEVERITY[i.deviation.severity].label}</Pill>
                  <span className="text-xs text-slate-600 dark:text-slate-300">{dueLabel(i.deviation)}</span>
                </>
              )}
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{i.text}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {a.name}
              {i.deviation?.responsible && i.status === 'avvik' ? ` • ${i.deviation.responsible}` : ''}
            </p>
            {i.comment && <p className="text-sm text-slate-700 dark:text-slate-200">{i.comment}</p>}
            <PhotoStrip photoIds={i.photoIds} size="sm" />
          </div>
        ))}
      </Card>

      <Card className="flex flex-col gap-4">
        <SectionTitle icon={<NotePencil size={20} weight="bold" className="text-orange-500" />}>Detaljer og oppsummering</SectionTitle>
        {locked ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm text-slate-700 dark:text-slate-200">
            <dt className="text-slate-500">Sted</dt>
            <dd>{round.location || '–'}</dd>
            <dt className="text-slate-500">Deltakere</dt>
            <dd>{round.participants || '–'}</dd>
            <dt className="text-slate-500">Oppsummering</dt>
            <dd className="whitespace-pre-wrap">{round.summary || '–'}</dd>
          </dl>
        ) : (
          <>
            <Field label="Tittel">
              <SaveOnBlur id="r-title" value={round.title} onSave={(v) => update((r) => void (r.title = v.trim() || r.title))} />
            </Field>
            <Field label="Sted eller avdeling">
              <SaveOnBlur id="r-location" value={round.location} onSave={(v) => update((r) => void (r.location = v.trim()))} placeholder="F.eks. Terminal Nord" />
            </Field>
            <Field label="Deltakere">
              <SaveOnBlur id="r-participants" value={round.participants} onSave={(v) => update((r) => void (r.participants = v.trim()))} placeholder="F.eks. verneombud, avdelingsleder" />
            </Field>
            <Field label="Oppsummering">
              <SaveOnBlur id="r-summary" multiline value={round.summary} onSave={(v) => update((r) => void (r.summary = v))} placeholder="Hovedinntrykk, positive funn og hva som bør følges opp" />
            </Field>
          </>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <SectionTitle icon={<SignatureIcon size={20} weight="bold" className="text-orange-500" />}>Digital signering på skjerm</SectionTitle>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Signer med fingeren for å godkjenne protokollen.</p>
        </div>
        {locked ? (
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ['Verneombud', round.signatures?.inspector],
                ['Leder', round.signatures?.manager],
              ] as const
            ).map(([label, sig]) => (
              <div key={label} className="flex flex-col items-center gap-1 rounded-xl bg-white p-3 ring-1 ring-slate-200 dark:ring-slate-700">
                <span className="text-xs text-slate-500">{label}</span>
                <div className="grid h-14 place-items-center">{sig?.image ? <img src={sig.image} alt="" className="max-h-14" /> : <span className="text-xs text-slate-400">Ikke signert</span>}</div>
                <span className="text-xs font-bold text-slate-900">{sig?.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <>
            <SigBlock
              key={`i-${round.id}`}
              label="Verneombud"
              name={inspectorName}
              image={round.signatures?.inspector?.image}
              onChange={(name, image) =>
                update((r) => {
                  r.signatures = { ...r.signatures, inspector: image ? { name, image, signedAt: Date.now() } : undefined }
                })
              }
            />
            <SigBlock
              key={`m-${round.id}`}
              label="Leder / HMS-ansvarlig"
              name={managerName}
              image={round.signatures?.manager?.image}
              onChange={(name, image) =>
                update((r) => {
                  r.signatures = { ...r.signatures, manager: image ? { name, image, signedAt: Date.now() } : undefined }
                })
              }
            />
          </>
        )}
      </Card>

      {locked ? (
        <>
          <Button variant="primary" size="lg" block onClick={() => setPreview(true)}>
            <FilePdf size={22} weight="bold" /> Vis og del PDF-rapport
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              if (await ask('Åpne runden for endringer igjen? Signaturene beholdes.', { confirmLabel: 'Åpne' })) update((r) => void (r.finishedAt = null))
            }}
          >
            <LockOpen size={16} /> Åpne for endringer
          </Button>
        </>
      ) : (
        <>
          <Button variant="primary" size="lg" block onClick={finish}>
            <Seal size={22} weight="bold" /> Fullfør og lag PDF-rapport
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setPreview(true)}>
            <FilePdf size={16} /> Forhåndsvis rapport
          </Button>
        </>
      )}

      {!locked && (
        <LinkButton href={`#/runde/${round.id}`} variant="ghost" size="sm">
          Tilbake til runden
        </LinkButton>
      )}

      {preview && <PdfPreview round={round} settings={settings} onClose={() => setPreview(false)} />}
    </AppShell>
  )
}

function SigBlock({ label, name, image, onChange }: { label: string; name: string; image?: string; onChange: (name: string, image: string | null) => void }) {
  const [n, setN] = useState(name)
  const [img, setImg] = useState<string | null>(image ?? null)
  return (
    <div className="flex flex-col gap-2">
      <SignaturePad
        label={`Signatur ${label.toLowerCase()}`}
        value={image}
        onChange={(d) => {
          setImg(d)
          onChange(n, d)
        }}
      />
      <input
        id={`sig-name-${label}`}
        className={cx(inputClass, '!min-h-10 !py-2 text-sm')}
        value={n}
        placeholder={`Navn, ${label.toLowerCase()}`}
        onChange={(e) => setN(e.target.value)}
        onBlur={() => img && onChange(n, img)}
      />
    </div>
  )
}
