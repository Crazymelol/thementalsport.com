---
name: remotion-video-creation
description: Use when building programmatic videos with Remotion (the React/TypeScript video framework), when working with compositions, useCurrentFrame, interpolate, spring, Sequence, or @remotion/cli rendering, or when generating videos from React components/code.
---

# Remotion Video Creation

## Overview
Remotion renders video from React. Each frame is a pure function of `useCurrentFrame()`. Animation = mapping frame numbers to style values with `interpolate`/`spring`. Determinism matters: avoid side effects; output must be the same for a given frame.

## Structure
1. **Setup**: `npx create-video@latest` (Hello World template). Dev with `npm run dev` (Studio); render with `npx remotion render`.
2. **Composition**: Register in `Root.tsx` via `<Composition id durationInFrames fps width height component>`.
3. **Animate**: Read `useCurrentFrame()` and `useVideoConfig()`; map to styles with `interpolate(frame, [in,out], [from,to], {extrapolateLeft:'clamp', extrapolateRight:'clamp'})` or `spring()`.
4. **Compose time**: `<Sequence from={30} durationInFrames={60}>` shifts a child's frame 0 to frame 30. Nest for timelines.
5. **Render**: `npx remotion render <id> out.mp4`.

## Code Example
```tsx
import {useCurrentFrame, useVideoConfig, interpolate, Sequence, AbsoluteFill} from 'remotion';

export const Title: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const opacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <h1 style={{opacity, fontSize: 90}}>{text}</h1>
    </AbsoluteFill>
  );
};

export const MyVideo = () => (
  <Sequence from={30} durationInFrames={90}>
    <Title text="Hello" />
  </Sequence>
);
```

## Quick Reference
| Need | API |
|---|---|
| Current frame | `useCurrentFrame()` |
| fps/dimensions | `useVideoConfig()` |
| Map frame to value | `interpolate(...)` |
| Physics motion | `spring({frame, fps})` |
| Time offset/slice | `<Sequence from durationInFrames>` |
| Full-screen layer | `<AbsoluteFill>` |
| Render | `npx remotion render` |

## Common Mistakes
- Animating with `setState`/timers instead of `useCurrentFrame()`.
- Forgetting `extrapolate*: 'clamp'`, causing values to overshoot ranges.
- Non-deterministic code (random without seed, `Date.now()`).
- Mismatched `durationInFrames` vs Sequence content length.
- Confusing seconds with frames (multiply by `fps`).

Keywords: remotion, react video, programmatic video, useCurrentFrame, interpolate, spring, Sequence, AbsoluteFill, Composition, remotion render, typescript video
