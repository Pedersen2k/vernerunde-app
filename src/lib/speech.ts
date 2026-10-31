/* Tale til tekst via nettleserens innebygde talegjenkjenning (støttes i Chrome på Android). */

interface RecognitionResultEvent {
  resultIndex: number
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>
}

interface Recognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((e: RecognitionResultEvent) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}

type RecognitionCtor = new () => Recognition

function ctor(): RecognitionCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export const speechSupported = () => ctor() !== null

/** Starter opptak. Kaller onText med ferdig tolket tekst. Returnerer en stoppfunksjon. */
export function listen(onText: (text: string) => void, onEnd: () => void): () => void {
  const C = ctor()
  if (!C) {
    onEnd()
    return () => {}
  }
  const r = new C()
  r.lang = 'nb-NO'
  r.continuous = true
  r.interimResults = false
  r.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i]
      if (res.isFinal) onText(res[0].transcript.trim())
    }
  }
  r.onend = onEnd
  r.onerror = onEnd
  try {
    r.start()
  } catch {
    onEnd()
  }
  return () => r.stop()
}
