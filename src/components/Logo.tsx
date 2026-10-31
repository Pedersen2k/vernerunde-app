import { useBlobUrl } from '../lib/useBlobUrl'
import { initials } from '../lib/settings'
import type { OrgSettings } from '../types'
import { Icon } from './Icon'

/** Firmalogo, eller initialer / skjold hvis ingen logo er lastet opp. */
export function Logo({ settings, size = 48, className = '' }: { settings: OrgSettings; size?: number; className?: string }) {
  const url = useBlobUrl(settings.logo)
  const text = initials(settings.companyName)
  return (
    <div className={`logo ${url ? 'logo-image' : ''} ${className}`} style={{ width: size, height: size }}>
      {url ? (
        <img src={url} alt={settings.companyName || 'Logo'} />
      ) : text ? (
        <span style={{ fontSize: size * 0.38 }}>{text}</span>
      ) : (
        <Icon name="shield" size={size * 0.55} />
      )}
    </div>
  )
}
