# Mathrank

A zoomable treemap of the math results OpenAI's models produced in September and October 2026.

- **Tile area** is Impact: how much a result would matter if it holds up.
- **Color** can show Difficulty, Lean proof status, review status, or release date.
- **Click a tile** to zoom into it. Use Back, the path above the map, or Esc to zoom out.
- Every view has its own link, for example `index.html#/nt/003` for the quasi-Riemann hypothesis.

## Hosting

The whole site is `index.html`. There's no build step and it makes no external requests, so you can serve it from any static host or open it straight from disk.

## Editing

All the data lives in `index.html`:

- `RESULTS`: one entry per result, holding its scores, field, Lean and review status, and the text shown on its detail card.
- `FIELDS`: the top-level groups, taken from the sections of OpenAI's catalog.
- `LINKS`: paper links from the [openai/math](https://github.com/openai/math) catalog as of October 26, 2026, keyed by family number.

## The scales

- **Significance** is how much the result would matter if it's correct, on a scale where the Riemann Hypothesis is 10.
- **Impact** is 10^((Significance − 8)/2). A solid 8.0 result is 1×, and every 2 extra points of Significance means 10× the Impact.
- **Difficulty** is how hard the problem was for people: how long it held out, how much effort went into it, and whether it needed new ideas. Proof length doesn't count.

The page gives human results to calibrate each scale. Every score is a judgment call, good to about ±0.3, and most of these results haven't had any human review yet.
