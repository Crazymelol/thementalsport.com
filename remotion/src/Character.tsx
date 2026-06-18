import React from 'react';
import Peep from 'react-peeps';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS} from './theme';
import type {CharacterScene} from './types';
import type {HairType} from 'react-peeps';

// Two-tone gold instead of a flat fill so the character reads as
// screen-printed comic ink rather than a flat brand swatch. Degree 135
// points the highlight at the same corner as the panel's glow below, so
// the figure looks lit from one consistent source.
const ACCENT_GRADIENT = {
  type: 'LinearGradient' as const,
  degree: 135,
  firstColor: '#ffe27a',
  secondColor: '#d99f00',
};

// Comic-panel card for the illustrated character. Occupies the top band of
// the screen; the caller positions/sizes it via `style`.
export const CharacterPanel: React.FC<{
  scene: CharacterScene;
  hair: HairType;
  style?: React.CSSProperties;
}> = ({scene, hair, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Each caption gets its own <Sequence>, which remounts this component and
  // resets frame to 0 — so this pop-in replays automatically on every scene
  // change with no scene-change detection needed.
  const enter = spring({frame, fps, config: {damping: 14, mass: 0.6, stiffness: 140}});
  const popScale = interpolate(enter, [0, 1], [0.7, 1]);
  const popY = interpolate(enter, [0, 1], [60, 0]);

  // Small continuous bob/sway layered on top of the pop-in so a held pose
  // never goes fully static once the entrance settles.
  const bob = Math.sin(frame / 20) * 6;
  const sway = Math.sin(frame / 27) * 1.4;

  return (
    <div
      style={{
        position: 'absolute',
        top: 56,
        left: 56,
        right: 56,
        height: '53%',
        borderRadius: 32,
        backgroundColor: COLORS.backgroundAlt,
        // Layered comic backdrop: a warm glow behind the figure, a faint
        // radiating action-line burst, and a tiled halftone dot screen —
        // all pure CSS gradients, no extra assets.
        backgroundImage: [
          'radial-gradient(circle at 50% 38%, rgba(245,197,24,0.22), transparent 60%)',
          'repeating-conic-gradient(from 0deg at 50% 42%, rgba(245,197,24,0.10) 0deg 9deg, transparent 9deg 18deg)',
          'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1.5px)',
        ].join(', '),
        backgroundSize: 'auto, auto, 15px 15px',
        backgroundRepeat: 'no-repeat, no-repeat, repeat',
        border: '3px solid rgba(245,197,24,0.22)',
        boxShadow: '0 28px 56px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        overflow: 'hidden',
        ...style,
      }}
    >
      <Peep
        body={scene.pose}
        face={scene.face}
        hair={hair}
        strokeColor={COLORS.foreground}
        backgroundColor={ACCENT_GRADIENT}
        // The SVG has a viewBox but no width/height attribute, so headless
        // Chrome doesn't reliably derive width from height + intrinsic ratio
        // (some poses render wide enough to clip against the panel's
        // overflow:hidden). Capping maxWidth guarantees it never exceeds the
        // panel regardless.
        style={{
          height: '94%',
          width: 'auto',
          maxWidth: '85%',
          display: 'block',
          transform: `translateY(${popY + bob}px) rotate(${sway}deg) scale(${popScale})`,
          filter:
            'drop-shadow(0 18px 22px rgba(0,0,0,0.45)) drop-shadow(0 4px 8px rgba(0,0,0,0.35))',
        }}
      />
    </div>
  );
};
