import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';
import {FPS, getCaptionTimings, getWordTimings} from './ShortVideo';
import {COLORS, FONT_FAMILY} from './theme';
import type {ShortAudio, WordTiming} from './types';

const fontFamily = FONT_FAMILY;

// Gold accent — same stop-power mark used on the Shorts.
const ACCENT = '#f5c518';

export type HeroVideoProps = {
  hook: string;
  script: string;
  cta: string;
  bookTitle: string;
  audience: string;
  // Optional per-segment narration in Giannis's cloned voice (voiceover.ts).
  // When present each Sequence is sized to its clip; otherwise the layout
  // falls back to the silent, word-count-timed pacing.
  audio?: ShortAudio;
};

// Fallbacks only used when narration is missing (real durations come from the
// audio clips, exactly like the Shorts pipeline).
const HERO_HOOK_FRAMES = 120; // 4s
const HERO_CTA_FRAMES = 150; // 5s

export const calculateHeroMetadata = ({props}: {props: HeroVideoProps}) => {
  const {durations} = getCaptionTimings(props.script, props.audio);
  const hookFrames = props.audio?.hook.durationInFrames ?? HERO_HOOK_FRAMES;
  const ctaFrames = props.audio?.cta.durationInFrames ?? HERO_CTA_FRAMES;
  const total = hookFrames + durations.reduce((a, b) => a + b, 0) + ctaFrames;
  return {durationInFrames: total, fps: FPS, width: 1920, height: 1080};
};

// One continuous, full-duration backdrop rendered BEHIND every sequence (not
// inside them) so the slow push-in, drifting light and grain run unbroken
// across the whole film instead of resetting on each caption. This is what
// gives a flat dark frame a cinematic, "shot" feel without any footage files.
const CinematicBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height, durationInFrames} = useVideoConfig();
  const progress = durationInFrames > 0 ? frame / durationInFrames : 0;
  const scale = 1 + progress * 0.08; // slow push-in
  const gx = 50 + Math.sin(frame / 240) * 12; // drifting key light
  const gy = 40 + Math.cos(frame / 300) * 10;
  const seed = Math.floor(frame / 2) % 100; // grain shimmer
  return (
    <AbsoluteFill style={{backgroundColor: COLORS.background, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          background: `radial-gradient(circle at ${gx}% ${gy}%, ${COLORS.backgroundAlt} 0%, ${COLORS.background} 58%)`,
        }}
      />
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          background: `radial-gradient(circle at ${gx}% ${gy}%, rgba(245,197,24,0.12) 0%, rgba(245,197,24,0) 38%)`,
          mixBlendMode: 'screen',
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 46%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.78) 100%)',
        }}
      />
      <svg
        width={width}
        height={height}
        style={{position: 'absolute', top: 0, left: 0, opacity: 0.05, mixBlendMode: 'overlay'}}
      >
        <filter id="heroGrain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves={2}
            seed={seed}
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#heroGrain)" />
      </svg>
    </AbsoluteFill>
  );
};

const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const progress = durationInFrames > 0 ? frame / durationInFrames : 0;
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <div
        style={{height: '100%', width: `${progress * 100}%`, backgroundColor: ACCENT, opacity: 0.85}}
      />
    </div>
  );
};

const Wordmark: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      bottom: 42,
      left: 0,
      right: 0,
      textAlign: 'center',
      color: COLORS.muted,
      fontFamily,
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: 5,
      textTransform: 'uppercase',
      opacity: 0.7,
    }}
  >
    thementalsport.com
  </div>
);

const HookScreen: React.FC<{hook: string}> = ({hook}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const words = hook.split(' ');
  const float = Math.sin(frame / 16) * 5;
  const wordsDoneAt = words.length * 2 + 6;
  const underline = interpolate(frame, [wordsDoneAt, wordsDoneAt + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const eyebrowOpacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: 120}}>
      <div
        style={{
          color: ACCENT,
          fontFamily,
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: 8,
          textTransform: 'uppercase',
          marginBottom: 40,
          opacity: eyebrowOpacity,
        }}
      >
        The Mental Sport
      </div>
      <div style={{transform: `translateY(${float}px)`, textAlign: 'center', maxWidth: 1500}}>
        <div
          style={{
            color: COLORS.foreground,
            fontFamily,
            fontSize: 104,
            fontWeight: 800,
            lineHeight: 1.08,
            textTransform: 'uppercase',
            letterSpacing: -1,
            textShadow: '0 6px 40px rgba(0,0,0,0.6)',
          }}
        >
          {words.map((w, i) => {
            const at = i * 2;
            const sc = spring({
              frame: frame - at,
              fps,
              config: {damping: 12, stiffness: 200},
              from: 0.5,
              to: 1,
            });
            const op = interpolate(frame - at, [0, 3], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <span
                key={i}
                style={{display: 'inline-block', transform: `scale(${sc})`, opacity: op, marginRight: '0.25em'}}
              >
                {w}
              </span>
            );
          })}
        </div>
        <div
          style={{
            height: 8,
            marginTop: 36,
            marginLeft: 'auto',
            marginRight: 'auto',
            width: `${underline * 40}%`,
            maxWidth: '60%',
            backgroundColor: ACCENT,
            borderRadius: 4,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const CaptionScreen: React.FC<{text: string; words?: WordTiming[]}> = ({text, words}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const opacity = interpolate(
    frame,
    [0, 6, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const translateY = interpolate(frame, [0, 10], [26, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const wordTimings = getWordTimings(text, durationInFrames, words);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: '0 200px'}}>
      <div
        style={{
          fontFamily,
          fontSize: 88,
          fontWeight: 700,
          lineHeight: 1.22,
          textAlign: 'center',
          opacity,
          transform: `translateY(${translateY}px)`,
          maxWidth: 1480,
          textShadow: '0 4px 30px rgba(0,0,0,0.7)',
        }}
      >
        {wordTimings.map(({word, from}, i) => (
          <React.Fragment key={i}>
            <span style={{color: frame >= from ? COLORS.foreground : 'rgba(161,161,170,0.55)'}}>
              {word}
            </span>
            {i < wordTimings.length - 1 ? ' ' : ''}
          </React.Fragment>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const CTAScreen: React.FC<{cta: string; bookTitle: string}> = ({cta, bookTitle}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = (delay: number) => {
    const sc = spring({
      frame: frame - delay,
      fps,
      config: {damping: 13, stiffness: 170},
      from: 0.85,
      to: 1,
    });
    const op = interpolate(frame - delay, [0, 8], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return {transform: `scale(${sc})`, opacity: op};
  };
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: 120, textAlign: 'center'}}>
      <div
        style={{
          ...pop(0),
          color: COLORS.muted,
          fontFamily,
          fontSize: 28,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 5,
          marginBottom: 28,
        }}
      >
        {bookTitle}
      </div>
      <div
        style={{
          ...pop(6),
          color: COLORS.foreground,
          fontFamily,
          fontSize: 72,
          fontWeight: 800,
          lineHeight: 1.18,
          marginBottom: 44,
          maxWidth: 1400,
          textTransform: 'uppercase',
          letterSpacing: -1,
        }}
      >
        {cta}
      </div>
      <div
        style={{
          ...pop(14),
          color: COLORS.background,
          backgroundColor: ACCENT,
          fontFamily,
          fontSize: 38,
          fontWeight: 800,
          padding: '22px 56px',
          borderRadius: 999,
          letterSpacing: 1,
        }}
      >
        thementalsport.com/free
      </div>
    </AbsoluteFill>
  );
};

export const HeroVideo: React.FC<HeroVideoProps> = ({hook, script, cta, bookTitle, audio}) => {
  const {captions, durations} = getCaptionTimings(script, audio);
  const hookFrames = audio?.hook.durationInFrames ?? HERO_HOOK_FRAMES;
  const ctaFrames = audio?.cta.durationInFrames ?? HERO_CTA_FRAMES;
  let from = hookFrames;
  const captionSequences = captions.map((caption, i) => {
    const captionAudio = audio?.captions[i];
    const seq = (
      <Sequence key={i} from={from} durationInFrames={durations[i]}>
        <CaptionScreen text={caption} words={captionAudio?.words} />
        {captionAudio && <Audio src={staticFile(captionAudio.src)} />}
      </Sequence>
    );
    from += durations[i];
    return seq;
  });

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.background}}>
      <CinematicBackground />
      <Sequence from={0} durationInFrames={hookFrames}>
        <HookScreen hook={hook} />
        {audio && <Audio src={staticFile(audio.hook.src)} />}
      </Sequence>
      {captionSequences}
      <Sequence from={from} durationInFrames={ctaFrames}>
        <CTAScreen cta={cta} bookTitle={bookTitle} />
        {audio && <Audio src={staticFile(audio.cta.src)} />}
      </Sequence>
      <Wordmark />
      <ProgressBar />
    </AbsoluteFill>
  );
};
