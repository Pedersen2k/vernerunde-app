import { ShieldCheck } from '@phosphor-icons/react'
import { useBlobUrl } from '../lib/useBlobUrl'
import type { OrgSettings } from '../types'
import { cx } from './ui'

/** Firmalogo, eller det oransje skjoldet hvis ingen logo er lastet opp. */
export function Logo({ settings, size = 36, className }: { settings: OrgSettings; size?: number; className?: string }) {
  const url = useBlobUrl(settings.logo)
  return (
    <div
      className={cx(
        'grid shrink-0 place-items-center overflow-hidden rounded-xl',
        url ? 'bg-white ring-1 ring-slate-200 dark:ring-slate-600' : 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md shadow-orange-600/30',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {url ? <img src={url} alt={settings.companyName || 'Logo'} className="h-full w-full object-contain p-1" /> : <ShieldCheck size={size * 0.62} weight="fill" />}
    </div>
  )
}
