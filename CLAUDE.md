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
