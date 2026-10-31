import { ArrowCounterClockwise, Check, EnvelopeSimple } from '@phosphor-icons/react'
import { dueLabel, isOverdue, SEV_TONE, SEVERITY, type DeviationRef } from '../lib/deviations'
import { formatDate } from '../lib/format'
import { deviationMail } from '../lib/mail'
import { mutateItem } from '../lib/rounds'
import { useSettings } from '../lib/settings'
import { ask } from './ConfirmDialog'
import { PhotoStrip } from './Photos'
import { toast } from './Toast'
import { Card, cx, Pill } from './ui'


async function setResolved(d: DeviationRef, resolved: boolean) {
  await mutateItem(d.round.id, d.item.id, (i) => {
    i.deviation = { ...d.deviation, resolvedAt: resolved ? Date.now() : null }
  })
  if (resolved) toast('Avviket er markert som utbedret')
}

export function DeviationCard({ d, now, showPhotos }: { d: DeviationRef; now: number; showPhotos?: boolean }) {
  const settings = useSettings()
  const late = isOverdue(d.deviation, now)
  const resolved = d.deviation.resolvedAt !== null
  return (
    <Card className={cx('flex flex-col gap-2', late && '!border-red-300 dark:!border-red-500/40')}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={SEV_TONE[d.deviation.severity]}>{SEVERITY[d.deviation.severity].label}</Pill>
            <span className={cx('text-xs font-semibold', resolved ? 'text-emerald-600 dark:text-emerald-500' : late ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400')}>
              • {resolved ? `Utbedret ${formatDate(d.deviation.resolvedAt!)}` : dueLabel(d.deviation, now)}
            </span>
          </div>
          <p className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">{d.item.text}</p>
          {d.item.comment && <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{d.item.comment}</p>}
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {[d.area.name, d.deviation.responsible || 'Ingen ansvarlig'].join(' • ')}
          </p>
        </div>
        {resolved ? (
          <button
            type="button"
            onClick={() => setResolved(d, false)}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/60"
          >
            <ArrowCounterClockwise size={14} /> Angre
          </button>
        ) : (
          <button
            type="button"
            onClick={async () => {
              if (await ask(`Marker «${d.item.text}» som utbedret?`, { confirmLabel: 'Utbedret' })) setResolved(d, true)
            }}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
          >
            <Check size={14} weight="bold" /> Utbedret
          </button>
        )}
      </div>
      {showPhotos && <PhotoStrip photoIds={d.item.photoIds} size="sm" />}
      {late && (
        <p className="rounded-xl bg-red-50 p-2.5 text-xs leading-relaxed text-red-800 dark:bg-red-500/10 dark:text-red-300">
          Fristen er passert. Send en skriftlig påminnelse til leder, og ta saken med hovedverneombud eller opp i AMU hvis den ikke lukkes.
        </p>
      )}
      {!resolved && settings && (
        <a
          href={deviationMail(d, settings).href}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 self-start rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 no-underline dark:border-slate-700 dark:text-slate-200"
        >
          <EnvelopeSimple size={16} weight="bold" /> {late ? 'Send påminnelse til leder' : 'Meld til leder på e-post'}
        </a>
      )}
    </Card>
  )
}
