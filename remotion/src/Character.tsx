import React from 'react';
import {Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {noise2D} from '@remotion/noise';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {COLORS} from './theme';
import type {CharacterScene} from './types';

// Renders the posed figure itself. Kept as its own component (rather than
// computing the transform in CharacterPanel and passing an element down)
// because CameraMotionBlur works by freeze-ing its children at several
// nearby-but-different frames and compositing them — that only produces a
// blur trail if something inside actually calls useCurrentFrame() per copy.
// If the transform were computed in the parent and handed down as a fixed
// style, every copy would freeze on the same already-resolved pose.
const AnimatedCharacter: React.FC<{scene: CharacterScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Each caption gets its own <Sequence>, which remounts this component and
  // resets frame to 0 — so this pop-in replays automatically on every scene
  // change with no scene-change detection needed.
  const enter = spring({frame, fps, config: {damping: 7, mass: 0.6, stiffness: 170}});
  const popScale = interpolate(enter, [0, 1], [0.7, 1]);
  const popY = interpolate(enter, [0, 1], [60, 0]);

  // Small continuous bob/sway layered on top of the pop-in so a held pose
  // never goes fully static once the entrance settles. Simplex noise instead
  // of a sine wave so the motion doesn't read as a mechanical, repeating
  // loop — each seed gets its own independent wander.
  const bob = noise2D('character-bob', frame * 0.05, 0) * 6;
  const sway = noise2D('character-sway', frame * 0.037, 0) * 1.4;

  return (
    <Img
      src={staticFile(`character/${scene.pose}-${scene.face}.webp`)}
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
  );
};

// Re-establishes the panel's bottom-anchored, centered composition inside
// CameraMotionBlur's children. CameraMotionBlur renders each sample in its
// own full-bleed AbsoluteFill (no alignment of its own), so without this the
// figure would stretch to fill the frame instead of sitting bottom-center.
const CharacterStage: React.FC<{scene: CharacterScene}> = ({scene}) => (
  <div
    style={{
      height: '100%',
      width: '100%',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
    }}
  >
    <AnimatedCharacter scene={scene} />
  </div>
);

const AUDIO_SAMPLES = 32; // visualizeAudio requires a power of two.

// Subtle glow behind the figure that brightens with narration loudness.
// Split out from CharacterPanel so useAudioData — which throws on an empty
// src — only ever runs when a real clip is mounted (panel callers omit
// audioSrc entirely for the no-narration fallback layout).
const AudioPulseGlow: React.FC<{src: string}> = ({src}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const audioData = useAudioData(src);
  if (!audioData) {
    return null;
  }

  const spectrum = visualizeAudio({audioData, frame, fps, numberOfSamples: AUDIO_SAMPLES});
  const peak = Math.max(...spectrum);
  // visualizeAudio normalizes each bin against the clip's own peak sample,
  // so a single bin rarely approaches 1 even on loud syllables — this
  // window is tuned by ear against rendered narration, not derived
  // analytically.
  const pulse = interpolate(peak, [0.05, 0.4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: `radial-gradient(circle at 50% 62%, rgba(245,197,24,${(0.16 + pulse * 0.26).toFixed(3)}) 0%, transparent 62%)`,
      }}
    />
  );
};

// Comic-panel card for the illustrated character. Occupies the top band of
// the screen; the caller positions/sizes it via `style`. `audioSrc` is
// optional — omit it for screens with no narration clip (the legacy
// silent-layout path never passes one).
export const CharacterPanel: React.FC<{
  scene: CharacterScene;
  audioSrc?: string;
  style?: React.CSSProperties;
}> = ({scene, audioSrc, style}) => {
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
        overflow: 'hidden',
        ...style,
      }}
    >
      {audioSrc && <AudioPulseGlow src={audioSrc} />}
      <CameraMotionBlur samples={6} shutterAngle={150}>
        <CharacterStage scene={scene} />
      </CameraMotionBlur>
    </div>
  );
};
