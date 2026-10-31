import { useEffect } from 'react'
import { useSettings } from '../lib/settings'

/** Setter firmafargen som CSS-variabel, så hele appen får firmaets farge. */
export function BrandStyle() {
  const s = useSettings()
  useEffect(() => {
    if (s?.accent) document.documentElement.style.setProperty('--brand', s.accent)
  }, [s?.accent])
  return null
}
