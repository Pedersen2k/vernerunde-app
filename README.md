# Vernerunde Pro

App for verneombud som går vernerunder. Utseende og flyt bygger på Gemini-prototypen, men alt lagres og virker på ekte.

## Funksjoner

- **Oversikt:** åpne avvik, forfalte frister, resultat fra siste runde, start eller fortsett runde
- **Bransjemaler:** lager og logistikk, bygg og anlegg, kontor, med veiledende lovhenvisning per punkt
- **Egne sjekklister:** soner, sjekkpunkter og egne lovhenvisninger
- **Vernerunde:** OK, Merknad eller Avvik per punkt, «Ikke relevant» og «Resten OK»
- **Registrer avvik:** ta bilde eller velg fra galleri, marker på bildet, snakk inn beskrivelsen, alvorlighetsgrad med automatisk frist (14 d / 7 d / straks) og ansvarlig
- **Nytt avvik** fra menyen, også uten pågående runde
- **Oppfølging:** liste over åpne og utbedrede avvik, med frist og «Utbedret»
- **Rapport:** signering på skjermen for verneombud og leder, PDF med firmalogo, deling på e-post via telefonens delingsmeny
- **Firmaprofil:** navn, avdeling, logo, verneombud, leder og personer som kan få ansvar
- Mørkt og lyst tema, virker uten nett, kan installeres på hjemskjermen (PWA)

## Utvikling

```bash
npm install
npm run dev      # utviklingsserver
npm run build    # bygg for produksjon (dist/)
npm run lint     # kodesjekk
SINGLE_FILE=1 npx vite build   # én samlet fil uten service worker (dist-single/), for forhåndsvisning
```

Teknologi: React, TypeScript, Vite, Tailwind CSS, Phosphor-ikoner, Dexie (IndexedDB), jsPDF og vite-plugin-pwa.

## Visninger under vernerunden

Valg av visning ligger øverst på skjermen og huskes:

- **Fokus-kort:** ett punkt om gangen. Sveip til høyre for OK, til venstre for avvik, eller bruk de store knappene.
- **Soner:** fliser per sone med fremdrift, og en liste over punktene i valgt sone. «Godkjenn sonen» og «Resten OK» sparer tid.
- **Kamera-først:** ta bilde, trykk på hurtig-etiketter, velg sone og alvorlighetsgrad, og lagre. Hele sjekklista kan krysses av i fart under.

## Publisere på GitHub Pages (for bruk på mobilen)

1. Flett pull requesten til `main`.
2. Gå til **Settings → Pages** i repoet og velg **Source: GitHub Actions**.
3. Arbeidsflyten «Bygg og publiser» bygger og publiserer appen. Adressen vises under Pages, vanligvis `https://<bruker>.github.io/vernerunde-app/`.
4. Åpne adressen på mobilen og velg «Legg til på startskjermen». Appen virker da uten nett, og kamera og deling fungerer.

Lokalt: `npm install`, deretter `npm run dev`. Sikkerhetskopi av data tas under Innstillinger.
