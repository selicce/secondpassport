# Portal visual refresh — how to apply

Three drop-in files. None change component props, exports, or page logic, so the build
stays safe and the dashboard page needs no edits. Each maps to one repo file:

| This file | Replaces in the repo |
| --- | --- |
| `globals.css` | `src/app/globals.css` |
| `stat-card.tsx` | `src/components/stat-card.tsx` |
| `progress-card.tsx` | `src/components/progress-card.tsx` |

## What changes

- **Global theme (`globals.css`)** — richer, deeper navy primary; a brighter, warmer gold
  accent; slightly larger corner radius; a faint navy+gold background wash for depth; a
  gold text-selection tint; refined scrollbars; and two new helper classes
  (`.card-lift` for a subtle hover lift, `.text-gold-gradient`, `.surface-navy-glow`).
  Existing classes used elsewhere (`.surface-navy`, `.hairline`, `.focus-ring`) are
  preserved, so nothing else breaks.
- **KPI cards (`stat-card.tsx`)** — a thin tone-colored accent rail across the top, a
  rounded tinted icon chip, a larger serif value, and a gentle hover lift.
- **Progress cards (`progress-card.tsx`)** — a circular **progress ring** (navy→gold sweep,
  green at 100%) with the percentage in the center, plus a gradient progress bar.

## Apply it (GitHub web editor — no terminal)

For each of the three files:

1. In your GitHub repo, open the target path (e.g. `src/app/globals.css`).
2. Click the **pencil** (Edit this file).
3. **Select all** in the editor and paste the contents of the matching file here.
4. **Commit changes** to `main`.

When the third commit lands, Netlify auto-rebuilds (~1–2 min) and
**https://huzhao.netlify.app** shows the refreshed look. (You can also do all three in one
commit via *Add file → Upload files* and dragging them into the right folders.)

## Notes

- Want to preview before committing? Drop the three files into your local repo and run
  `npm run dev`.
- Fully reversible — if you don't like it, revert the commit and Netlify redeploys the
  previous version.
- The colors are intentionally still in the private-banking navy/gold family, just richer.
  If you want a different accent (e.g. a cooler steel-blue or a deeper emerald), say so and
  I'll send an updated `globals.css` — it's a one-file change.
