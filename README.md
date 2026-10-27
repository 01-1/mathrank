# Mathrank

A zoomable treemap of the math results OpenAI's models produced in September and October 2026.

- **Tile area** is Impact by default: how much a result would matter if it holds up. It can also be sized by Difficulty, or with every tile equal.
- **Color** shows Difficulty or Impact in 5 steps (by default whichever one isn't setting the size), or Lean proof status, review status, or release date.
- **For scale**: dashed tiles beside the map show the Riemann Hypothesis and Fermat/Poincaré at the same scale. A checkbox hides them.
- **Nested results**: the Oct 26 local smoothing result implies two Oct 6 results, so they're drawn inside its tile at their own size. The rest of its tile is what's new, and they aren't counted twice.
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

- **Impact** is how much the result would matter if it's correct.
- **Difficulty** is how hard the problem was for people: how long it held out, how much effort went into it, and whether it needed new ideas. Proof length doesn't count.

Both are absolute, linear scales with the Riemann Hypothesis at 10: a score of 4 is twice a score of 2. Tile areas are directly proportional to the selected score. Labels, color legends, tooltips, detail meters, and human reference scores all use these same absolute values.

The page gives human results to calibrate each scale. Every score is a rough judgment call, with uncertainty of about 40%, and most of these results haven't had any human review yet.
