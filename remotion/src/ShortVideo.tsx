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
import {splitIntoCaptions} from './splitScript';
import {COLORS, FONT_FAMILY, audienceLabel} from './theme';
import type {ShortAudio, WordTiming} from './types';

const fontFamily = FONT_FAMILY;

// Gold accent — matches the Champion Psychology lion mark. Used sparingly for
// stop-power in the first seconds (retention prototype).
const ACCENT = '#f5c518';

export type ShortVideoProps = {
  hook: string;
  script: string;
  cta: string;
  bookTitle: string;
  audience: string;
  // Optional per-segment narration (see voiceover.ts). When omitted, the
  // video falls back to the silent, text-timed layout below.
  audio?: ShortAudio;
};

export const FPS = 30;
const HOOK_FRAMES = 90; // 3s
const CTA_FRAMES = 100; // ~3.3s
const WORDS_PER_SECOND = 2.3;
const MIN_CAPTION_FRAMES = 55;

// When `audio` is provided, each caption's duration matches its narration
// clip exactly (so the <Audio> for that Sequence never gets cut off);
// otherwise it falls back to the WORDS_PER_SECOND heuristic.
export const getCaptionTimings = (script: string, audio?: ShortAudio) => {
  const captions = splitIntoCaptions(script);
  const durations = captions.map(
    (c, i) =>
      audio?.captions[i]?.durationInFrames ??
      Math.max(
        MIN_CAPTION_FRAMES,
        Math.round((c.split(' ').length / WORDS_PER_SECOND) * FPS),
      ),
  );
  return {captions, durations};
};

// Per-word reveal timing for the caption highlight sweep, in frames relative
// to the caption's own Sequence. Uses real alignment data from generate.py
// when available (`audioWords`, in seconds); otherwise distributes the
// caption's duration across words proportional to character length, which
// approximates natural speech pacing (short words go quickly, long words
// linger) far better than revealing the whole chunk at once.
export const getWordTimings = (
  caption: string,
  durationInFrames: number,
  audioWords?: WordTiming[],
): {word: string; from: number}[] => {
  const words = caption.split(' ');
  if (audioWords && audioWords.length === words.length) {
    return words.map((word, i) => ({
      word,
      from: Math.min(
        Math.max(durationInFrames - 1, 0),
        Math.max(0, Math.round(audioWords[i].start * FPS)),
      ),
    }));
  }
  const totalChars = words.reduce((sum, w) => sum + w.length, 0);
  let chars = 0;
  return words.map((word) => {
    const from = Math.round((chars / totalChars) * durationInFrames);
    chars += word.length;
    return {word, from};
  });
};

export const calculateShortMetadata = ({
  props,
}: {
  props: ShortVideoProps;
}) => {
  const {durations} = getCaptionTimings(props.script, props.audio);
  const hookFrames = props.audio?.hook.durationInFrames ?? HOOK_FRAMES;
  const ctaFrames = props.audio?.cta.durationInFrames ?? CTA_FRAMES;
  const total = hookFrames + durations.reduce((a, b) => a + b, 0) + ctaFrames;
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

// Retention-reworked hook: words stamp in fast (motion from frame 1, not a
// static wall fading in), a gold accent bar wipes under once they land, and the
// whole block keeps a subtle float so the frame is never still — the things that
// hold a Shorts viewer past the first 2 seconds. Prototype pending owner review.
const HookScreen: React.FC<{audience: string; hook: string}> = ({
  audience,
  hook,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const words = hook.split(' ');
  const float = Math.sin(frame / 14) * 6;
  const wordsDoneAt = words.length * 2 + 6;
  const underline = interpolate(frame, [wordsDoneAt, wordsDoneAt + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const labelOpacity = interpolate(frame, [0, 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: 72}}>
      <Background />
      <div
        style={{
          position: 'absolute',
          top: 150,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: ACCENT,
          fontFamily,
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: 6,
          textTransform: 'uppercase',
          opacity: labelOpacity,
        }}
      >
        For {audienceLabel(audience)}
      </div>
      <div style={{transform: `translateY(${float}px)`, textAlign: 'center'}}>
        <div
          style={{
            color: COLORS.foreground,
            fontFamily,
            fontSize: 84,
            fontWeight: 800,
            lineHeight: 1.12,
            textTransform: 'uppercase',
            letterSpacing: -1,
          }}
        >
          {words.map((w, i) => {
            const at = i * 2;
            const scale = spring({
              frame: frame - at,
              fps,
              config: {damping: 11, stiffness: 200},
              from: 0.4,
              to: 1,
            });
            const opacity = interpolate(frame - at, [0, 3], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  transform: `scale(${scale})`,
                  opacity,
                  marginRight: '0.25em',
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
        <div
          style={{
            height: 8,
            marginTop: 28,
            marginLeft: 'auto',
            marginRight: 'auto',
            width: `${underline * 55}%`,
            maxWidth: '70%',
            backgroundColor: ACCENT,
            borderRadius: 4,
          }}
        />
      </div>
      <Wordmark />
    </AbsoluteFill>
  );
};

const CaptionScreen: React.FC<{text: string; words?: WordTiming[]}> = ({
  text,
  words,
}) => {
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
  const wordTimings = getWordTimings(text, durationInFrames, words);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: 90}}>
      <Background />
      <div
        style={{
          color: COLORS.muted,
          fontFamily,
          fontSize: 72,
          fontWeight: 700,
          lineHeight: 1.25,
          textAlign: 'center',
          opacity,
          transform: `translateY(${translateY}px)`,
        }}
      >
        {wordTimings.map(({word, from}, i) => (
          <React.Fragment key={i}>
            <span style={{color: frame >= from ? COLORS.foreground : COLORS.muted}}>
              {word}
            </span>
            {i < wordTimings.length - 1 ? ' ' : ''}
          </React.Fragment>
        ))}
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
  audio,
}) => {
  const {captions, durations} = getCaptionTimings(script, audio);
  const hookFrames = audio?.hook.durationInFrames ?? HOOK_FRAMES;
  const ctaFrames = audio?.cta.durationInFrames ?? CTA_FRAMES;
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
      <Sequence from={0} durationInFrames={hookFrames}>
        <HookScreen audience={audience} hook={hook} />
        {audio && <Audio src={staticFile(audio.hook.src)} />}
      </Sequence>
      {captionSequences}
      <Sequence from={from} durationInFrames={ctaFrames}>
        <CTAScreen cta={cta} bookTitle={bookTitle} />
        {audio && <Audio src={staticFile(audio.cta.src)} />}
      </Sequence>
    </AbsoluteFill>
  );
};
