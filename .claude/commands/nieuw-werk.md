---
description: Voeg nieuw werk of een nieuw showreel toe aan de portfoliosite (vragenlijst)
---

Voeg content toe aan de portfoliosite. Volg deze stappen.

1. Lees `content/README.md` voor de regels.
2. Kijk wat er in `content/inbox/` staat (`ls -la content/inbox`). Staat er niets, zeg dan dat Christiaan eerst bestanden in `content/inbox/` moet zetten, of dat een YouTube/Vimeo-link ook kan.
3. Vraag wat hij wil doen: **nieuw werk** of **showreel vervangen**.
4. Stel de vragenlijst voor nieuw werk. Doe dat kort en in het Nederlands, maximaal 4 vragen per keer (AskUserQuestion mag):
   - Welke inbox-bestanden horen bij dit werk (standaard alle)?
   - Titel, categorie (`design`, `video`, `foto`, meerdere mag) en een korte caption (één zin).
   - Jaar, klant, rol en een optionele beschrijving.
   - Video-link (YouTube/Vimeo), cover (bij meerdere afbeeldingen) en of het uitgelicht moet worden.
   - Wil Christiaan ook een Engelse versie? Zo ja, vertaal jij de Nederlandse teksten naar het Engels (titel, caption, rol, beschrijving), laat het resultaat kort zien en zet het in `en`. Een Engelse bezoeker ziet anders de Nederlandse tekst.
   Stel optionele vragen niet los voor elk veld; bied "overslaan" aan. Verzin zelf nooit titels, captions of klantnamen.
5. Schrijf de antwoorden als JSON naar `/tmp/antwoorden.json` en draai `node scripts/nieuw.mjs --from /tmp/antwoorden.json`. Velden:
   `{"title","categories":[],"caption","year","client","role","description","files":["bestand.jpg"],"cover","featured":false,"videoUrl":"","en":{"title","caption","role","description"}}`
   Voor het showreel: `{"action":"showreel","file":"naam.mp4"}`; voor de verticale telefoonversie: `{"action":"showreel-mobiel","file":"naam.mp4"}`.
6. Controleer dat het werk in `public/work.json` staat en meld eventuele waarschuwingen van het script.
7. Zeg dat het te bekijken is op https://preview.cvisserdesign.nl/work/. Zet het **niet** live: alleen `npm run live` op uitdrukkelijk verzoek.
8. Commit de wijziging op `main` met een duidelijke boodschap. Per CLAUDE.md hoort bij een wijziging een release: nieuw werk is een PATCH (`./scripts/release.sh patch`). Vraag of Christiaan die release wil, of doe hem als hij dat eerder heeft gevraagd.
