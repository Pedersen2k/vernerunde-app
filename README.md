# Vernerunde

En app for verneombud som gjennomfører vernerunder. Brukeren lager egne sjekklister med områder og kontrollpunkter, går runden på mobilen, registrerer OK, avvik eller ikke relevant, og legger ved bilder og kommentarer.

Appen er laget som en webapp (PWA) som virker uten nett og kan legges på hjemskjermen. Den samme koden skal senere pakkes som app for Google Play.

## Dette kan appen nå

- Lage, redigere, kopiere og slette sjekklister med områder og kontrollpunkter
- Starte en vernerunde fra en sjekkliste, med tittel, sted og deltakere
- Merke hvert punkt som OK, avvik eller ikke relevant
- Ta bilde og skrive kommentar på et punkt, og legge til egne punkter underveis
- Se fremdrift per område og en oppsummering med alle avvik
- Fullføre runden, og åpne den igjen ved behov
- Alt lagres lokalt på enheten (IndexedDB) og virker uten nett

## Kommer

- Rapport som PDF, deling på e-post
- Oppfølging av tiltak med ansvarlig og frist
- Innlogging og synk mellom enheter
- Android-app for Google Play

## Utvikling

```bash
npm install
npm run dev      # utviklingsserver
npm run build    # bygg for produksjon
npm run lint     # kodesjekk
```

Teknologi: React, TypeScript, Vite, Dexie (IndexedDB) og vite-plugin-pwa.
