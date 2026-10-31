export type Status = 'ok' | 'avvik' | 'na'

export interface TemplateCheckpoint {
  id: string
  text: string
}

export interface TemplateArea {
  id: string
  name: string
  checkpoints: TemplateCheckpoint[]
}

export interface Template {
  id: string
  name: string
  areas: TemplateArea[]
  createdAt: number
  updatedAt: number
}

export interface RoundItem {
  id: string
  text: string
  status: Status | null
  comment: string
  photoIds: string[]
}

export interface RoundArea {
  id: string
  name: string
  comment: string
  items: RoundItem[]
}

export interface Round {
  id: string
  templateId: string
  title: string
  location: string
  participants: string
  startedAt: number
  finishedAt: number | null
  summary: string
  areas: RoundArea[]
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
  logo: Blob | null
  accent: string
  onboarded: boolean
}
