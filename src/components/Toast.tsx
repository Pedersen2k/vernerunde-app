import { CheckCircle } from '@phosphor-icons/react'
import { useEffect, useSyncExternalStore } from 'react'

let message: { id: number; text: string } | null = null
const listeners = new Set<() => void>()

// oxlint-disable-next-line react/only-export-components
export function toast(text: string) {
  message = { id: Date.now(), text }
  listeners.forEach((l) => l())
}

export function ToastHost() {
  const m = useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => message,
  )
  useEffect(() => {
    if (!m) return
    const t = window.setTimeout(() => {
      if (message?.id === m.id) {
        message = null
        listeners.forEach((l) => l())
      }
    }, 2600)
    return () => window.clearTimeout(t)
  }, [m])
  if (!m) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+96px)] z-[70] flex justify-center px-4">
      <div
        key={m.id}
        role="status"
        className="flex max-w-sm animate-toast-in items-center gap-2.5 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-xl ring-1 ring-slate-200 dark:bg-cardElevated dark:text-white dark:ring-slate-700"
      >
        <CheckCircle size={20} weight="fill" className="shrink-0 text-emerald-500" />
        {m.text}
      </div>
    </div>
  )
}
