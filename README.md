# Tropical fruit hormone charts

How gibberellin (GA), cytokinin, abscisic acid (ABA), auxin (IAA) and ethylene change through flowering, fruit set and ripening in 13 tropical fruit crops: mango, litchi, longan, durian, mangosteen, rambutan, banana, papaya, pineapple, guava, passion fruit, avocado and citrus.

Live site: https://stanleywoosweeleong.github.io/crophormone/ (served by GitHub Pages from the root of `main`). It is a Progressive Web App: on a phone, use "Add to Home screen" or the Install button, and it keeps working offline after the first visit.

## Files

- `index.html`, `styles.css`, `app.js` – the app: Overview, Ripening, Flowering and Fruit set views
- `report.html` – renders `report.md`, the full research report with gaps, conflicts and DOI status
- `data/*.csv` – the values behind each chart, with verification level and source for every row
- `manifest.webmanifest`, `sw.js`, `icons/` – install and offline support
- `.nojekyll` – serve files as they are, without a Jekyll build

When you change any app or data file, bump `VERSION` in `sw.js` so installed copies refresh their offline cache.

## Verification levels

**FT** full text read, **ABS** abstract only, **SEC** quoted by a review or guide, **SNIP** search snippet only. Rows marked "Inferred" in `lifecycle_direction.csv` come from the crop's fruit type or general tree physiology, not from measurements in that crop.
