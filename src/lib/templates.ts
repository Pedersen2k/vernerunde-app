import { db, uid } from '../db'
import type { Template, TemplateIcon } from '../types'
import { go } from './router'

type Seed = { name: string; icon: TemplateIcon; areas: { name: string; points: [string, string?][] }[] }

const AML_FYSISK = 'Arbeidsmiljøloven § 4-4: Arbeidsplassen skal være forsvarlig utformet og innrettet.'
const BRANN = 'Forskrift om brannforebygging: Rømningsveier skal holdes frie, og slokkeutstyr skal være tilgjengelig og kontrollert.'
const IK = 'Internkontrollforskriften § 5: Risiko skal kartlegges, og avvik skal følges opp.'

/** Bransjemaler som følger med appen. Henvisningene er veiledende. */
export const SEED_TEMPLATES: Seed[] = [
  {
    name: 'Terminal: vareflyt og feltstruktur',
    icon: 'lager',
    areas: [
      {
        name: 'Feltstruktur og gulv',
        points: [
          ['Oppstillingsfelt respekteres: ingen paller eller bur står utenfor oppmerkede linjer', 'Sikrer fri sikt i kryss og forutsigbar vareflyt. ' + AML_FYSISK],
          ['Gulvmerking, sone-skilt og fotgjengerfelt er synlige og ikke slitt bort', 'Arbeidsplassforskriften: ferdselsveier skal være tydelig merket.'],
        ],
      },
      {
        name: 'Vareflyt og kjørebane',
        points: [
          ['Hovedkjørebaner for truck og jekketralle er frie for hensatt gods', 'Arbeidsplassforskriften: ferdselsveier skal være frie for hindringer.'],
          ['Tompaller er stablet i egne felt, ikke over anbefalt høyde og ikke på høykant', 'Forebygging av velt og klemskader. ' + AML_FYSISK],
          ['Gående og truck er skilt der det er mulig, og krysningspunkter er sikret', AML_FYSISK],
        ],
      },
      {
        name: 'Brann og rømning',
        points: [
          ['Nødutganger, rømningsveier og brannslukkere er frie og ikke blokkert', BRANN],
          ['Brannslukkere er merket, plombert og kontrollert i tide', BRANN],
        ],
      },
      {
        name: 'Reoler og sikring',
        points: [['Pallereoler har intakt stolpevern og ingen synlige påkjørselsskader på bærejern', 'NS-EN 15635: Skadet reol skal avlastes og merkes umiddelbart.']],
      },
      {
        name: 'Truck og lading',
        points: [
          ['Ladeområde for truck har hele ladekabler, god ventilasjon og er fritt for papp og plast', BRANN],
          ['Truckene er kontrollert, og førerne har gyldig opplæring', 'Forskrift om utførelse av arbeid: krav til opplæring og sikker bruk av trucker.'],
        ],
      },
      {
        name: 'Porter og lasterampe',
        points: [['Kjøreporter, lasteramper og tetting fungerer uten skader eller fallfare', 'Arbeidsplassforskriften: sikring av lastekaier og ramper. ' + AML_FYSISK]],
      },
      {
        name: 'Orden og renhold',
        points: [
          ['Gulv er fritt for løs krympeplast, papprester og væskesøl (skli- og snublefare)', AML_FYSISK],
          ['Tunge og hyppige løft er vurdert, og løftehjelpemidler er tilgjengelige', 'Forskrift om utførelse av arbeid: krav til manuell håndtering. ' + AML_FYSISK],
        ],
      },
    ],
  },
  {
    name: 'Hurtigsjekk ved skiftstart (2 min)',
    icon: 'lager',
    areas: [
      {
        name: 'Egen stasjon og nærsone',
        points: [
          ['Stasjon, scanner og hjelpemidler er klargjort og ryddet etter forrige skift', AML_FYSISK],
          ['Gangbane og oppstillingsfelt rundt egen stasjon er frie for hindringer', AML_FYSISK],
          ['Nærmeste nødutgang og brannslukker i sonen er ublokkert', BRANN],
        ],
      },
    ],
  },
  {
    name: 'Lager og logistikk',
    icon: 'lager',
    areas: [
      {
        name: 'Varemottak og høytlager',
        points: [
          ['Rømningsveier og nødutganger er frie for hindringer', BRANN],
          ['Truck- og gangsoner er tydelig merket og adskilt', AML_FYSISK],
          ['Pallereoler er uten synlige påkjørselsskader og har stolpevern', 'NS-EN 15635: Skadede reoler skal sperres og utbedres.'],
          ['Brannslukningsutstyr og brannslanger er lett tilgjengelig', BRANN],
          ['Belysning er god, og gulv er uten søl eller snublefare', AML_FYSISK],
        ],
      },
      {
        name: 'Pakkestasjoner og kjemikalier',
        points: [
          ['Orden og ryddighet ved pakkestasjoner', AML_FYSISK],
          ['Kjemikalier er riktig merket og lagret, og stoffkartotek er tilgjengelig', 'Forskrift om utførelse av arbeid: krav til stoffkartotek og sikker bruk av kjemikalier.'],
          ['Arbeidshøyde og løftehjelpemidler er tilpasset arbeidet', AML_FYSISK],
        ],
      },
      {
        name: 'Pauserom og garderobe',
        points: [
          ['Pauserom er rent og har tilstrekkelig plass', 'Arbeidsplassforskriften: krav til spiserom, garderobe og sanitæranlegg.'],
          ['Førstehjelpsutstyr er komplett og lett tilgjengelig', IK],
        ],
      },
    ],
  },
  {
    name: 'Bygg og anlegg',
    icon: 'bygg',
    areas: [
      {
        name: 'Stillas og arbeid i høyden',
        points: [
          ['Stillas er kontrollert, merket og har rekkverk', 'Forskrift om utførelse av arbeid: krav til stillas og arbeid i høyden.'],
          ['Åpninger i dekke og kanter er sikret mot fall', AML_FYSISK],
          ['Personlig fallsikringsutstyr er kontrollert og i bruk', 'Forskrift om utførelse av arbeid: krav til bruk av personlig verneutstyr.'],
        ],
      },
      {
        name: 'Riggområde og strøm',
        points: [
          ['Byggestrøm og skjøteledninger er uten skader', 'Forskrift om elektriske lavspenningsanlegg.'],
          ['Adkomstveier er ryddige og godt belyst', AML_FYSISK],
          ['Brannslokkere er tilgjengelige ved varme arbeider', BRANN],
          ['SHA-plan er tilgjengelig og kjent', 'Byggherreforskriften: krav til plan for sikkerhet, helse og arbeidsmiljø.'],
        ],
      },
    ],
  },
  {
    name: 'Kontor og administrasjon',
    icon: 'kontor',
    areas: [
      {
        name: 'Arbeidsplasser',
        points: [
          ['Arbeidsstoler og bord kan tilpasses den enkelte', AML_FYSISK],
          ['Skjermer er riktig plassert og uten gjenskinn', AML_FYSISK],
          ['Belysning er god nok for arbeidet', AML_FYSISK],
        ],
      },
      {
        name: 'Inneklima og brann',
        points: [
          ['Inneklima oppleves som godt (temperatur, luft, støy)', 'Arbeidsplassforskriften: krav til ventilasjon, temperatur og luftkvalitet.'],
          ['Rømningsveier er frie og nødlys fungerer', BRANN],
          ['Ansatte kjenner til branninstruks og møteplass', BRANN],
        ],
      },
      {
        name: 'Psykososialt arbeidsmiljø',
        points: [
          ['Ansatte vet hvordan de melder avvik og bekymringer', IK],
          ['Arbeidsmengde og arbeidstid er forsvarlig', 'Arbeidsmiljøloven § 4-3: krav til det psykososiale arbeidsmiljøet.'],
        ],
      },
    ],
  },
]

export function seedTemplates(): Template[] {
  const now = Date.now()
  return SEED_TEMPLATES.map((t, i) => ({
    id: uid(),
    name: t.name,
    icon: t.icon,
    createdAt: now + i,
    updatedAt: now + i,
    areas: t.areas.map((a) => ({
      id: uid(),
      name: a.name,
      checkpoints: a.points.map(([text, law]) => ({ id: uid(), text, law })),
    })),
  }))
}

export async function createTemplate() {
  const now = Date.now()
  const id = uid()
  await db.templates.add({
    id,
    name: 'Ny sjekkliste',
    icon: 'annet',
    createdAt: now,
    updatedAt: now,
    areas: [{ id: uid(), name: 'Sone 1', checkpoints: [] }],
  })
  go(`/maler/${id}`)
}

export const TEMPLATE_EMOJI: Record<TemplateIcon, string> = {
  lager: '📦',
  bygg: '🏗️',
  kontor: '💻',
  annet: '📋',
}
