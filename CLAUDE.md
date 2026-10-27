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
