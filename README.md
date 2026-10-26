# Tropical fruit hormone charts

How gibberellin (GA), cytokinin, abscisic acid (ABA), auxin (IAA) and ethylene change through flowering, fruit set and ripening in 13 tropical fruit crops: mango, litchi, longan, durian, mangosteen, rambutan, banana, papaya, pineapple, guava, passion fruit, avocado and citrus.

Live site: https://stanleywoosweeleong.github.io/crophormone/ (served by GitHub Pages from the root of `main`). It is a Progressive Web App: tap **Install app** in the top bar. Chrome and Edge open their install prompt when they offer one; other browsers (iPhone, iPad, Firefox, Safari on Mac) get the steps for that browser. It keeps working offline after the first visit.

## Files

- `index.html`, `styles.css`, `app.js` – the app: Overview, Regulators, Ripening, Flowering and Fruit set views
- `report.html` – renders `report.md`, the full research report with gaps, conflicts and DOI status
- `data/hormone_evidence.csv` – one row per crop × stage × hormone for ten hormone classes (GA, cytokinin, ABA, IAA, ethylene, JA, SA, brassinosteroids, polyamines, strigolactones), plus other signals such as florigen and melatonin; `basis` is Measured, Partly measured, Inferred, Treatment only or No data
- `data/regulators.csv` – commercial regulators and treatments: product, the hormone it boosts or blocks, measured hormone changes, visible effect, side effects and evidence type
- `data/*.csv` (others) – the values behind each chart, with verification level and source for every row
- `manifest.webmanifest`, `sw.js`, `update.js`, `install.js`, `icons/` – install, offline support and update notices
- `.nojekyll` – serve files as they are, without a Jekyll build
- `tools/stamp_assets.py` – adds a content fingerprint to each script and stylesheet link (`app.js?v=…`)

Updates need no version bump. The service worker fingerprints the app and data files; when any of them change, readers see "App updated to the latest version" the next time they open the app, or a "Reload" prompt if it is already open (checked when the app returns to the foreground and every 30 minutes). A new file must be added to `APP_FILES` in `sw.js` to be cached and watched.

Before committing a change to `styles.css`, `app.js`, `update.js` or `install.js`, run `python tools/stamp_assets.py`. It updates the `?v=` fingerprints in `index.html` and `report.html`, so browsers can't pair a new page with a cached old script (GitHub Pages lets browsers reuse files for 10 minutes).

## Verification levels

**FT** full text read, **ABS** abstract only, **SEC** quoted by a review or guide, **SNIP** search snippet only. Rows marked "Inferred" in `hormone_evidence.csv` come from the crop's fruit type or general tree physiology, not from measurements in that crop.
