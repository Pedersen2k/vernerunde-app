import { useEffect, useState } from 'react'

/** Lager en midlertidig URL for et bilde lagret som Blob, og rydder opp etterpå. */
export function useBlobUrl(blob: Blob | null | undefined) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!blob) {
      // oxlint-disable-next-line react/set-state-in-effect
      setUrl(undefined)
      return
    }
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])
  return url
}
