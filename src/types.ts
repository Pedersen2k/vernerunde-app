export type Status = 'ok' | 'merknad' | 'avvik' | 'na'

export type Severity = 'lav' | 'middels' | 'kritisk'

/** Oppfølging av et avvik: alvorlighetsgrad, frist, ansvarlig og om det er utbedret. */
export interface Deviation {
  severity: Severity
  due: number
  responsible: string
  resolvedAt: number | null
}

export interface TemplateCheckpoint {
  id: string
  text: string
  /** Veiledende henvisning til lov, forskrift eller standard. */
  law?: string
}

export interface TemplateArea {
  id: string
  name: string
  checkpoints: TemplateCheckpoint[]
}

export interface Template {
  id: string
  name: string
  icon?: TemplateIcon
  areas: TemplateArea[]
  createdAt: number
  updatedAt: number
}

export type TemplateIcon = 'lager' | 'bygg' | 'kontor' | 'annet'

export interface RoundItem {
  id: string
  text: string
  law?: string
  status: Status | null
  comment: string
  photoIds: string[]
  deviation?: Deviation
}

export interface RoundArea {
  id: string
  name: string
  comment: string
  items: RoundItem[]
}

export interface Signature {
  name: string
  /** PNG som data-URL. */
  image: string
  signedAt: number
}

export interface Round {
  id: string
  templateId: string
  templateName?: string
  title: string
  location: string
  participants: string
  startedAt: number
  finishedAt: number | null
  summary: string
  areas: RoundArea[]
  signatures?: { inspector?: Signature; manager?: Signature }
}

export interface Photo {
  id: string
  roundId: string
  blob: Blob
  createdAt: number
}

export interface OrgSettings {
  key: 'org'
  companyName: string
  department: string
  inspectorName: string
  managerName: string
  responsibles: string[]
  logo: Blob | null
  onboarded: boolean
  theme: 'dark' | 'light'
  /** Sjekklisten som er valgt i toppen av skjermen. */
  currentTemplateId?: string
  designMode: DesignMode
  /** Hurtig-etiketter som brukes ved raske avviksregistreringer. */
  quickTags: string[]
}

export type DesignMode = 'deck' | 'zones' | 'camera'
