# Content toevoegen

Je hoeft alleen **bestanden en teksten** toe te voegen. De site doet de rest: formaten maken, posters genereren, sorteren en tonen.

## Het snelst: de vragenlijst

1. Zet je foto's en video's in **`content/inbox/`** (sleep ze in de bestandsboom van CloudCLI, of upload ze daar).
2. Draai in de terminal:

   ```bash
   npm run nieuw
   ```

3. Beantwoord de vragen (titel, categorie, caption, jaar, klant, rol, beschrijving, link, uitgelicht).
4. Kijk op **https://preview.cvisserdesign.nl/work/**. Het verschijnt vanzelf.

Of vraag het aan Claude: typ `/nieuw-werk`. Claude stelt dezelfde vragen en zet alles klaar.

## De vragen

| Vraag | Verplicht | Uitleg |
|---|---|---|
| Titel | ja | Naam van het project |
| Categorie | ja | `design`, `video` en/of `foto` (meerdere mag). Hiermee werken de filters |
| Caption | aanbevolen | Eén korte zin onder het werk |
| Jaar | nee | Standaard dit jaar. Bepaalt de volgorde (nieuwste bovenaan) |
| Klant | nee | Opdrachtgever |
| Rol | nee | Bijvoorbeeld "Regie, montage" |
| Beschrijving | nee | Langere tekst; een lege regel maakt een nieuwe alinea |
| Video-link | nee | YouTube- of Vimeo-link voor grote video's (aanbevolen boven uploaden) |
| Engels | nee | Engelse titel, caption, rol en beschrijving. Zonder Engels ziet een Engelse bezoeker de Nederlandse tekst |
| Cover | nee | Welke afbeelding als voorbeeld in het raster staat. Standaard de eerste |
| Uitgelicht | nee | Grote tegel (twee kolommen breed) op de werkpagina |

## Handmatig kan ook

Elk werk is een map in `content/work/`, bijvoorbeeld `content/work/2026-mijn-project/`, met je bestanden en een `info.json`:

```json
{
  "title": "Mijn project",
  "categories": ["video", "design"],
  "caption": "Een korte zin.",
  "year": "2026",
  "client": "Klantnaam",
  "role": "Regie, montage",
  "description": "Eerste alinea.\n\nTweede alinea.",
  "featured": true,
  "videoUrl": "https://vimeo.com/123456789",
  "en": { "title": "My project", "caption": "A short sentence.", "role": "Direction, editing", "description": "First paragraph." },
  "cover": "01.jpg",
  "media": ["01.jpg", "02.jpg", "film.mp4"],
  "order": 1
}
```

- `media` (de volgorde van de bestanden) en `cover`, `order` zijn optioneel. Zonder `media` staan alle foto's en video's in de map op alfabet.
- Een map verwijderen haalt het werk van de site.

## Bestanden

- **Foto's:** jpg, png, webp, avif. Maakt zelf kleine en grote formaten (webp).
- **Video's:** mp4 (h264) werkt overal. Andere formaten, of mp4's boven 40 MB, zet `npm run nieuw` automatisch om. Boven 100 MB accepteert GitHub niets: gebruik dan een YouTube- of Vimeo-link.
- **Posters** van video's worden automatisch uit het beeld gehaald.

## Showreel (home)

`npm run nieuw` en kies "2) Showreel vervangen". Of zet zelf een video in `content/showreel/` (één bestand; eventueel `poster.jpg` als stilstaand beeld). Het showreel speelt zonder geluid af (er is bewust geen geluidsknop). Voor de website maakt de site er automatisch een **lichte webversie** van (zonder geluid, ongeveer 6 Mbit/s, direct afspeelbaar), zodat het snel start. Je origineel in `content/showreel/` blijft ongemoeid; de eerste keer duurt de omzetting even.

## Tweetalig (NL/EN)

De site heeft een taalwissel met twee vlaggetjes. Een bezoeker krijgt standaard de taal van zijn browser (Nederlands of Engels) en de keuze wordt onthouden.

- **Vaste teksten** (menu, knoppen, contactpagina): staan in `src/i18n.js`.
- **Je werk:** voeg bij elk werk de Engelse titel, caption, rol en beschrijving toe in het blok `"en"` van `info.json` (de vragenlijst vraagt ernaar). Vraag het anders aan Claude: "vertaal mijn werk naar het Engels".
- **Ken je mij nog niet?:** de tekst staat in `content/about.json`, per taal (`nl` en `en`). Pas hem aan wanneer je wilt, of vraag het aan Claude.

## Ken je mij nog niet? (foto)

Zet een foto in `content/about/` met de naam `portrait.jpg` (ook png, webp of avif werkt). Zonder foto staat er je sterlogo.

## Showreel voor telefoons (verticaal)

Heb je een verticale versie (9:16)? Zet die in **`content/showreel/mobiel/`** (zie het LEESMIJ-bestand daar), of draai `npm run nieuw` en kies **3**. Alleen telefoons in portret (tot 700 pixels breed) krijgen die versie. Iedereen anders ziet het gewone showreel. Staat er niets in die map, dan krijgen telefoons het gewone showreel.

## Voorbeeldcontent

De mappen die met `voorbeeld` beginnen in `content/work/` en het testshowreel in `content/showreel/` zijn tijdelijk. Verwijder ze zodra je eigen werk erin staat.

## Live zetten

Pas als jij zegt dat het klaar is, wordt het live gezet met `npm run live`. Alles ervoor is alleen zichtbaar op de preview.
