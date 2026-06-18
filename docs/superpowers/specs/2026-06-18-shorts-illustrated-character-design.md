# Illustrated Character for Shorts — Design

**Date:** 2026-06-18
**Status:** Approved, implementing
**Owner ask:** "for the next video we need something different like cartoon or sketch
characters this is boring" (re: hero-001's text-only kinetic-typography look) —
redirected to the Shorts pipeline so the result also satisfies "post those video
in all platforms" using existing automation (see §2).

## 1. Goal

Give one recurring hand-drawn character a presence in Shorts videos, acting out
each script beat (pose + expression) in sync with the captions, at zero added
cost (no new API keys/services — same constraint that has governed every
decision in this pipeline).

## 2. Why Shorts, not another Hero video

The Hero (long-form) queue posts to YouTube only — there is no cross-posting
wired up for it. The Shorts queue (`social/youtube-queue/queue.json`) already
auto-cross-posts every item to YouTube Shorts + TikTok + Pinterest + X via four
independent cron workflows. Building the character feature on `ShortVideo.tsx`
gets "post everywhere" for free, using infrastructure that already exists,
instead of requiring new cross-platform integration work.

## 3. Non-goals

- Not applied to `HeroVideo.tsx` in this pass (may follow later as a separate
  port; the component is built generically enough to make that cheap, but it's
  not part of this change).
- Not a default for all Shorts. Opt-in per item via a new optional
  `character` field — existing/legacy items render exactly as today.
- Not full-bleed background art. The owner specifically chose "illustrated
  story panels," not a host avatar or a decorative-only accent.

## 4. Character library — `react-peeps`

MIT-licensed, zero runtime dependencies, ships its SVG artwork inside the npm
package (no network call at render time, no new cost). Default export `Peep`
takes `body`, `face`, `hair`, optional `accessory`/`facialHair`, and
`strokeColor`/`backgroundColor` to recolor the line art and fill
independently of the (fixed) base SVGs.

**Fixed identity, for continuity across panels and future videos:**
`hair: 'Short'`, no accessory, no facial hair. Recolor: `strokeColor:
COLORS.foreground` (line art), `backgroundColor: ACCENT` (the existing gold
`#f5c518` brand accent, as the clothing/fill color) — gives a two-tone sketch
that's instantly on-brand. Confirmed by reading the package's compiled output
that both props map to real fill colors on the two artwork layers (not just
CSS decoration), so this recolors cleanly.

## 5. Layout (1080×1920, vertical)

Side-by-side (viable in Hero's 16:9) doesn't work in a 1080-wide frame. Each
screen type splits into two bands instead:

- **Top ~58%** — a comic-panel card (`COLORS.backgroundAlt`, rounded corners,
  subtle border) containing the character in that beat's pose + expression.
- **Bottom ~42%** — existing text content, untouched logic: the word-highlight
  caption sweep, the hook word-stamp, the CTA pill. Just resized into the
  shorter band.

Applies uniformly to `HookScreen`, `CaptionScreen`, and `CTAScreen` so the
character is on-screen for the full video, not just the body captions.
`Wordmark` stays bottom-anchored as today.

When `character` is absent from props, all three screens render exactly as
they do now (full centered layout, no panel) — verified by keeping the
existing layout as the unconditional default and only switching bands when a
scene is supplied.

## 6. Data flow / schema

New types in `remotion/src/types.ts`:

```ts
export type CharacterScene = {pose: StandingPoseType; face: FaceType};
export type CharacterConfig = {
  hair: HairType;
  hook: CharacterScene;
  scenes: CharacterScene[]; // one per caption, same order as splitIntoCaptions(script)
  cta: CharacterScene;
};
```

`ShortVideoProps` gains `character?: CharacterConfig`. `render-queue.ts`'s
`QueueItem` type and `inputProps` construction pass `item.character` straight
through — no other production script needs changes, since
`post-youtube-short.mjs` calls `render-queue.ts` as a subprocess and never
touches props directly.

Queue items opt in with a `character` block of the same shape. This mirrors
the existing `qa_status` precedent in this file (additive optional field;
items without it are unaffected).

## 7. v1 pose/expression set

Kept to a small fixed library — enough range for a ~45–60s script without
overbuilding:

| Concept | `StandingPoseType` |
|---|---|
| Neutral / explaining setup | `RestingWB` |
| Pointing / direct address | `PointingFingerWB` |
| Tense / defensive | `CrossedArmsWB` |
| Calm / reflective | `EasingWB` |
| Confident / forward motion | `WalkingWB` |

| Concept | `FaceType` |
|---|---|
| Neutral | `Calm` |
| Intense / serious | `Driven` |
| Positive | `Smile` |

Each queue item's `scenes` array picks combinations per caption to act out
that script's emotional beats (e.g. tense pose on the "spiral" lines, confident
pose on the resolution lines).

## 8. Rendering / QA

Same proven path as hero-001: render locally via `render-queue.ts` with
`REMOTION_BROWSER_EXECUTABLE`/`REMOTION_CHROME_MODE` pointed at the
pre-installed headless-shell binary (works offline, sidesteps the blocked
`remotion.media` download host), then visually QA the output with
claude-video-vision before it's allowed to post. Cloned-voice narration is
generated by a separate CI workflow (Chatterbox, needs HuggingFace — confirmed
unreachable from this sandbox per the 2026-06-15 QA-gate spec, §7a) so the
local render uses the silent/text-timed fallback; this only affects timing
precision, not whether the visual design (panel, recolor, poses) reads
correctly, which is what local QA is checking.

## 9. Rollout

1. Add `Character.tsx` (the panel + `Peep` wrapper), update `types.ts`,
   restructure `ShortVideo.tsx`'s three screens into top-panel/bottom-text.
2. Add `react-peeps` to `remotion/package.json`.
3. Write one new queue item (`short-040`) with a full script + `character`
   scenes authored to match its narrative arc, `qa_status: "pending"`.
4. Per owner decision, insert it at the **front** of
   `social/youtube-queue/queue.json`'s `items` array (there's a 25-item
   legacy backlog; appending to the end would bury it for weeks before any
   platform's poster reached it).
5. Render locally (no audio) and visually QA the new layout/character.
6. Commit + push to the dev branch. Actually going live still requires this
   to reach `master` and a poster run to pick it up — out of scope for this
   sandbox to trigger directly (no posting secrets here; this repo's standing
   rule is also not to open a PR unless asked).
