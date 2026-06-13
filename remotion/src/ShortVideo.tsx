import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';
import {splitIntoCaptions} from './splitScript';
import {COLORS, FONT_FAMILY, audienceLabel} from './theme';

const fontFamily = FONT_FAMILY;

export type ShortVideoProps = {
  hook: string;
  script: string;
  cta: string;
  bookTitle: string;
  audience: string;
};

export const FPS = 30;
const HOOK_FRAMES = 90; // 3s
const CTA_FRAMES = 100; // ~3.3s
const WORDS_PER_SECOND = 2.3;
const MIN_CAPTION_FRAMES = 55;

export const getCaptionTimings = (script: string) => {
  const captions = splitIntoCaptions(script);
  const durations = captions.map((c) =>
    Math.max(
      MIN_CAPTION_FRAMES,
      Math.round((c.split(' ').length / WORDS_PER_SECOND) * FPS),
    ),
  );
  return {captions, durations};
};

export const calculateShortMetadata = ({
  props,
}: {
  props: ShortVideoProps;
}) => {
  const {durations} = getCaptionTimings(props.script);
  const total =
    HOOK_FRAMES + durations.reduce((a, b) => a + b, 0) + CTA_FRAMES;
  return {durationInFrames: total, fps: FPS, width: 1080, height: 1920};
};

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const progress = frame / durationInFrames;
  return (
    <AbsoluteFill style={{backgroundColor: COLORS.background}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% ${30 + progress * 25}%, ${COLORS.backgroundAlt} 0%, ${COLORS.background} 70%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 28,
          left: 28,
          right: 28,
          height: 5,
          borderRadius: 3,
          backgroundColor: 'rgba(255,255,255,0.12)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            backgroundColor: COLORS.foreground,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const Wordmark: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      bottom: 56,
      left: 0,
      right: 0,
      textAlign: 'center',
      color: COLORS.muted,
      fontFamily,
      fontSize: 28,
      fontWeight: 600,
      letterSpacing: 4,
      textTransform: 'uppercase',
    }}
  >
    thementalsport.com
  </div>
);

const PopIn: React.FC<{children: React.ReactNode; delay?: number}> = ({
  children,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const localFrame = Math.max(0, frame - delay);
  const scale = spring({
    frame: localFrame,
    fps,
    config: {damping: 12, stiffness: 180},
    from: 0.85,
    to: 1,
  });
  const opacity = interpolate(localFrame, [0, 8], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  return <div style={{transform: `scale(${scale})`, opacity}}>{children}</div>;
};

const HookScreen: React.FC<{audience: string; hook: string}> = ({
  audience,
  hook,
}) => (
  <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: 80}}>
    <Background />
    <PopIn>
      <div
        style={{
          color: COLORS.muted,
          fontFamily,
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: 6,
          textTransform: 'uppercase',
          marginBottom: 40,
          textAlign: 'center',
        }}
      >
        For {audienceLabel(audience)}
      </div>
    </PopIn>
    <PopIn delay={5}>
      <div
        style={{
          color: COLORS.foreground,
          fontFamily,
          fontSize: 88,
          fontWeight: 700,
          lineHeight: 1.15,
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: -1,
        }}
      >
        {hook}
      </div>
    </PopIn>
    <Wordmark />
  </AbsoluteFill>
);

const CaptionScreen: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const opacity = interpolate(
    frame,
    [0, 6, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const translateY = interpolate(frame, [0, 10], [24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: 90}}>
      <Background />
      <div
        style={{
          color: COLORS.foreground,
          fontFamily,
          fontSize: 72,
          fontWeight: 700,
          lineHeight: 1.25,
          textAlign: 'center',
          opacity,
          transform: `translateY(${translateY}px)`,
        }}
      >
        {text}
      </div>
      <Wordmark />
    </AbsoluteFill>
  );
};

const CTAScreen: React.FC<{cta: string; bookTitle: string}> = ({
  cta,
  bookTitle,
}) => (
  <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: 80}}>
    <Background />
    <PopIn>
      <div
        style={{
          color: COLORS.muted,
          fontFamily,
          fontSize: 30,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 4,
          marginBottom: 32,
          textAlign: 'center',
        }}
      >
        {bookTitle}
      </div>
    </PopIn>
    <PopIn delay={6}>
      <div
        style={{
          color: COLORS.foreground,
          fontFamily,
          fontSize: 64,
          fontWeight: 700,
          textAlign: 'center',
          lineHeight: 1.3,
          marginBottom: 48,
        }}
      >
        {cta}
      </div>
    </PopIn>
    <PopIn delay={12}>
      <div
        style={{
          color: COLORS.background,
          backgroundColor: COLORS.foreground,
          fontFamily,
          fontSize: 36,
          fontWeight: 700,
          padding: '20px 48px',
          borderRadius: 999,
          letterSpacing: 1,
        }}
      >
        thementalsport.com/free
      </div>
    </PopIn>
  </AbsoluteFill>
);

export const ShortVideo: React.FC<ShortVideoProps> = ({
  hook,
  script,
  cta,
  bookTitle,
  audience,
}) => {
  const {captions, durations} = getCaptionTimings(script);
  let from = HOOK_FRAMES;
  const captionSequences = captions.map((caption, i) => {
    const seq = (
      <Sequence key={i} from={from} durationInFrames={durations[i]}>
        <CaptionScreen text={caption} />
      </Sequence>
    );
    from += durations[i];
    return seq;
  });

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.background}}>
      <Sequence from={0} durationInFrames={HOOK_FRAMES}>
        <HookScreen audience={audience} hook={hook} />
      </Sequence>
      {captionSequences}
      <Sequence from={from} durationInFrames={CTA_FRAMES}>
        <CTAScreen cta={cta} bookTitle={bookTitle} />
      </Sequence>
    </AbsoluteFill>
  );
};
