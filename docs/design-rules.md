# Sabitek design rules

These rules are what make every screen look like one product. They are
enforced by `tests/design-rules.test.ts`, which runs in CI, so a change that
breaks one fails before it can merge.

## Who this is for

Sabitek is a training platform for institutions, instructors and learners in
Africa. Many learners are on mid-range phones and slow connections. The
interface should be quick to load, easy to read, and stay out of the way of
the lesson.

## What is distinctive, and kept

- **One accent colour: the brand red** (`red-600`). It marks the primary
  action on a screen and little else.
- **The serif italic phrase in headlines** ("Prove real outcomes."). It gives
  the product the feel of a credential, which is what it issues.

## The rules

1. **No gradients.** Each surface is one flat colour, and that includes SVG
   strokes and chart fills. The only exception is a black fade over a photo
   so text on it stays readable.
2. **No blur and no glow.** Cards are white with a 1px gray border. Shadows are
   at most `shadow-sm`.
3. **Five colours.** Gray for surfaces and text, red for the brand, and green,
   amber and blue for status only (success, warning, information). Nothing
   else exists in the Tailwind theme, so a class outside it produces no CSS.
   Hex codes in charts and inline SVG come from the same five.
4. **Two font weights: 400 and 500.** Hierarchy comes from size, colour and
   space, not from boldness.
5. **Spacing on a 4px grid.** Padding, margin and gap use whole steps of the
   Tailwind scale (`1` = 4px). No `0.5`, `1.5`, `2.5` or `3.5`.
6. **Corners at most 12px** (`rounded-xl`). Pills and avatars (`rounded-full`)
   are the exception.
7. **Motion only when it tells the user something.** Loading spinners and
   skeletons are fine, and so is content fading or sliding in once. No
   bouncing, pinging, floating or zoom-on-hover. People who ask their device
   for reduced motion get none.
8. **Icons, not emojis.** Use `lucide-react`.

## Where the theme lives

- `tailwind.config.js`: the palette, the two weights and the typefaces.
- `app/globals.css`: the colour tokens (`--primary`, `--border`, ...).
- `app/layout.tsx`: the two typefaces, self-hosted at build time.
- `components/ui/*`: shared button, card, input. Prefer these to restyling an
  element by hand.

## Exceptions

- **SabiQuiz** keeps its emoji racers and the race progress bar. They are the
  game's content, not decoration.
- **Certificate artwork and social preview images** are documents, not
  interface, and use their own inline styles.
