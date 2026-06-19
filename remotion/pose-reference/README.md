# Pose reference images

One flat, high-contrast PNG per Open Peeps `StandingPoseType` used in
`social/youtube-queue/queue.json`'s `character` blocks. Originally rendered
by a throwaway Remotion script (`render-pose-references.ts`, removed after
use — see docs/superpowers/specs/2026-06-18-custom-character-art-design.md)
while `react-peeps` was still a dependency.

`scripts/character/generate.py` runs Canny edge detection on these to
condition SDXL's ControlNet, so the generated character keeps the same
body proportions and pose composition already tuned in `CharacterPanel`'s
layout. Kept around after the swap so a future pose addition has a
reference to extend from.
