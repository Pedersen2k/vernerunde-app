import { Siren } from '@phosphor-icons/react'

/** Vises ved kritiske avvik: minner om hva verneombudet kan og bør gjøre med en gang. */
export function CriticalNotice() {
  return (
    <div role="note" className="flex gap-3 rounded-2xl border border-red-500/40 bg-red-50 p-3 text-xs leading-relaxed text-red-900 dark:bg-red-500/10 dark:text-red-200">
      <Siren size={22} weight="fill" className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
      <div>
        <p className="font-bold">Kritisk avvik: si fra til leder med en gang</p>
        <p className="mt-1">
          Er det overhengende fare for liv eller helse, kan verneombudet stanse arbeidet (arbeidsmiljøloven § 6-3). Sperr av området, varsle leder og hovedverneombud, og dokumenter med bilde og tidspunkt.
        </p>
      </div>
    </div>
  )
}
