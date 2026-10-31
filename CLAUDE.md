# Projectregels: cvisserdesign

## Versies en releases (Semantic Versioning)
Elke wijziging aan de website krijgt een release met een versienummer volgens https://semver.org: `MAJOR.MINOR.PATCH`, tags in de vorm `vX.Y.Z`.

- **PATCH** (`v0.1.0` → `v0.1.1`): bugfix, tekst- of stijlaanpassing, kleine inhoudelijke wijziging.
- **MINOR** (`v0.1.0` → `v0.2.0`): nieuwe pagina, sectie of functie, achterwaarts compatibel.
- **MAJOR** (`v0.x` → `v1.0.0`, daarna `v2.0.0`): ingrijpende herontwerp of breaking change. `v1.0.0` is de eerste officiële livegang.
- Voor `v1.0.0` zitten we in de initiële ontwikkelfase (`0.y.z`).

Werkwijze na elke wijziging:
1. Commit de wijziging op `main` met een duidelijke boodschap.
2. Kies PATCH, MINOR of MAJOR en leg die keuze kort uit.
3. Draai `./scripts/release.sh <patch|minor|major>`. Het script verhoogt het versienummer (ook in `package.json` zodra dat bestaat), zet de tag, pusht en maakt de GitHub-release met automatische release notes.
4. Draai het script nooit met een vuile werkmap of zonder nieuwe commits.

## Live zetten is losgekoppeld van bouwen
- `dist/` is wat bezoekers zien op https://cvisserdesign.nl. De webserver leest die map direct.
- `npm run build` schrijft naar `build/` en is **niet** live. Werk-in-uitvoering bekijk je via `npm run dev` op https://preview.cvisserdesign.nl (achter Cloudflare Access, alleen voor Christiaan).
- Alleen `npm run live` (`scripts/live.sh`) kopieert `build/` naar `dist/`. Doe dat uitsluitend als Christiaan daar expliciet om vraagt.
- Schrijf nooit zelf naar `dist/` en bouw nooit met `--outDir dist`.
- Een release (versienummer) is los van live zetten: ook een release gaat niet vanzelf live.
- De huidige livepagina (noodpagina met de camerabajonet) is tag `v0.6.0`. Terugzetten: `git checkout v0.6.0`, `npm run live`, daarna terug naar `main`.

## Content en pagina's
- Home (`index.html`): alleen het showreel (`content/showreel/`) met een knop naar `/work/`. Werkpagina: `work/index.html` met filters (design, video, foto) en een detailweergave.
- Alle content staat in `content/`. Christiaan voegt alleen content toe: `npm run nieuw` of `/nieuw-werk`. Zie `content/README.md`.
- `scripts/content.mjs` zet `content/` om naar `public/work.json` en `public/media/` (gegenereerd, niet in git). Vite draait dit automatisch.
- Pas de code van de site alleen aan als Christiaan om een wijziging in het ontwerp of de functies vraagt. Nieuw werk toevoegen vraagt geen codewijziging.
- Huisstijl: zwart en wit, accent limoengroen `#a7c818`, koppen in Archivo (breed, 800), tekst in DM Sans. Minimalistisch houden.
- Voorbeeldcontent (`voorbeeld` in de mapnaam, testshowreel) moet worden weggehaald voordat de site live gaat.

## Pagina's, taal en teksten
- Pagina's: `/` (showreel), `/work/`, `/about/` ("Ken je mij nog niet?") en `/contact/`. Header en footer zitten in `scripts/partials.mjs` en komen in elke pagina via `{{header:pagina}}` en `{{footer}}`.
- Tweetalig (NL/EN) met vlaggetjes. Vaste teksten staan in `src/i18n.js` (voeg bij een nieuwe tekst altijd beide talen toe). Teksten in HTML krijgen `data-i18n="sleutel"`. Content krijgt een optioneel `en`-blok in `info.json`.
- De tekst van "Ken je mij nog niet?" staat in `content/about.json` (per taal) en is persoonlijk: pas hem alleen aan op verzoek van Christiaan. Hij is tekstueel een lossere versie van zijn eigen tekst, inclusief zijn standpunt over AI als hulpmiddel en menselijkheid.
- Contactgegevens (e-mail en telefoon) staan in `scripts/partials.mjs`, `contact/index.html` en `index.html`/andere pagina's: wijzig ze overal.

## Showreel en laadscherm
- Het showreel op de home (en de verticale telefoonversie in `content/showreel/mobiel/`) wordt door `scripts/content.mjs` omgezet naar een lichte webversie in `public/media/showreel/` (zonder geluid). Het origineel in `content/` verandert niet. Een gegenereerde kopie die ouder lijkt dan de bron wordt niet opnieuw gemaakt: verwijder `public/media/showreel/showreel.mp4` om hem te forceren.
- Het laadscherm (`src/loader.js`, markup in `scripts/partials.mjs`) wacht op de home niet op de video, alleen op de poster. Houd het snel: minimum 800 ms bij het eerste bezoek, 250 ms daarna.
