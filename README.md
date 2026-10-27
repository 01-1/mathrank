# Mathrank

A zoomable treemap of selected AI-assisted mathematical discoveries and claims from 2022–2026, across OpenAI, Claude, AxiomProver, and Google DeepMind's AlphaTensor, FunSearch, and AlphaEvolve. It includes unreviewed claims as well as published results, with their scope and verification evidence kept explicit.

The collection includes the reported Jacobian counterexample in dimensions ≥ 3 (not the plane case), Fel's conjecture, finite matrix-multiplication algorithms, cap-set constructions, and an eleven-dimensional kissing-number lower bound. It is curated, not exhaustive; historical records are not necessarily today's best bounds.

- **Tile area** is Impact by default: how much a result would matter if it holds up. It can also be sized by Difficulty, or with every tile equal.
- **Color** shows Difficulty or Impact in 5 steps (by default whichever one isn't setting the size), or Lean proof status, review status, or release cohort. Earlier discoveries share a neutral cohort; detail cards and tooltips show exact dates and AI attribution.
- **For scale**: dashed tiles beside the map show the Riemann Hypothesis and Fermat/Poincaré at the same scale. A checkbox hides them.
- **Nested results**: the Oct 26 local smoothing result implies two Oct 6 results, so they're drawn inside its tile at their own size. The rest of its tile is what's new, and they aren't counted twice.
- **Click a tile** to zoom into it. Use Back, the path above the map, or Esc to zoom out.
- Every view has its own link, for example `index.html#/nt/003` for the quasi-Riemann hypothesis.

## Hosting

The whole site is `index.html`. There's no build step and it makes no external requests, so you can serve it from any static host or open it straight from disk.

## Editing

All the data lives in `index.html`:

- `RESULTS`: one entry per result, holding its scores, field, Lean and review status, and the text shown on its detail card. Existing records default to OpenAI. Cross-system entries set `system` (AI attribution and documented collaborators), `date` (announcement or first-paper date, qualified in the notes), and `papers` (`{t, u}` source links). `rel` selects a release-color cohort, not the exact date. Use unique slug IDs for results outside OpenAI's catalog; existing numeric IDs and links remain unchanged.
- Scores are displayed as absolute values, but stored `sig` and `diff` use the original encoding: `absolute = 10 ** ((stored - 8) / 2)`. To enter an absolute score, use `stored = 8 + 2 * Math.log10(absolute)`.
- `FIELDS`: the top-level groups, taken from the sections of OpenAI's catalog.
- `LINKS`: paper links from the [openai/math](https://github.com/openai/math) catalog as of October 26, 2026, keyed by family number. Per-result `papers` supply additional sources without inventing catalog membership.

Lean verification, automated computational checks, and independent expert review are separate. A published construction need not prove optimality, and a Lean artifact still requires checking that its statement matches the intended theorem. Detail notes distinguish these cases and identify claims whose independent review is not established.

## The scales

- **Impact** is how much the result would matter if it's correct.
- **Difficulty** is how hard the problem was for people: how long it held out, how much effort went into it, and whether it needed new ideas. Proof length doesn't count.

Both are absolute, linear scales with the Riemann Hypothesis at 10: a score of 4 is twice a score of 2. Tile areas are directly proportional to the selected score. Labels, color legends, tooltips, detail meters, and human reference scores all use these same absolute values.

The page gives human results to calibrate each scale. Every score is a rough judgment call, with uncertainty of about 40%, and most of these results haven't had any human review yet.
