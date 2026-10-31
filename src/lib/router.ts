import { useEffect, useState } from 'react'

/*
 * Enkel ruter. Vanligvis brukes adressefeltets #-del, slik at tilbakeknappen virker.
 * Når appen kjører inne i en ramme (forhåndsvisning), holdes ruten i minnet i stedet.
 */
const embedded = (() => {
  try {
    return window.self !== window.top
  } catch {
    return true
  }
})()

let memoryPath = ''
const listeners = new Set<() => void>()

function parse(path: string): string[] {
  return path.replace(/^#?\/?/, '').split('/').filter(Boolean).map(decodeURIComponent)
}

function currentPath() {
  return embedded ? memoryPath : window.location.hash
}

export function useRoute(): string[] {
  const [route, setRoute] = useState(() => parse(currentPath()))
  useEffect(() => {
    const onChange = () => {
      setRoute(parse(currentPath()))
      window.scrollTo(0, 0)
    }
    listeners.add(onChange)
    window.addEventListener('hashchange', onChange)
    return () => {
      listeners.delete(onChange)
      window.removeEventListener('hashchange', onChange)
    }
  }, [])
  return route
}

export function go(path: string) {
  if (embedded) {
    memoryPath = path
    listeners.forEach((l) => l())
  } else {
    window.location.hash = path
  }
}

// Fanger opp klikk på interne lenker (href="#/...") når ruten holdes i minnet.
if (embedded) {
  document.addEventListener('click', (e) => {
    const a = (e.target as Element | null)?.closest?.('a[href^="#/"]')
    if (!a) return
    e.preventDefault()
    go(a.getAttribute('href')!.slice(1))
  })
}
