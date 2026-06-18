import React from 'react';
import {Composition} from 'remotion';
import {ShortVideo, calculateShortMetadata} from './ShortVideo';
import {HeroVideo, calculateHeroMetadata} from './HeroVideo';

const SAMPLE_PROPS = {
  hook: "What you say in the car after the game matters more than anything the coach said.",
  script:
    "Don't open with the scoreboard. Don't open with the mistakes. Open with one sentence: 'I love watching you play.' Full stop. If they want to talk tactics, let THEM bring it up. Then praise one thing they controlled: 'I noticed how you kept battling after that mistake.' Not talent. Not the result. Effort and response. That's how confidence survives a bad game.",
  cta: 'Free mental-game guide for sports parents — link in description.',
  bookTitle: 'The Competition Protocol',
  audience: 'parents',
};

// Long-form / hero sample (the real script lives in the hero queue and is
// supplied via inputProps at render time; this only seeds the Studio preview).
const HERO_SAMPLE_PROPS = {
  hook: "Pressure doesn't build character. It reveals it.",
  script:
    "Every athlete trains the body. The deciding moment is never physical. That voice in your head is the inner game. Almost nobody trains it. Confidence is something you build on purpose. Awareness. Reframe. Anchor. Train it and you play free.",
  cta: 'Start your free seven-day mental performance system today. Win the inner game.',
  bookTitle: 'The Competition Protocol',
  audience: 'athletes',
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ShortVideo"
        component={ShortVideo}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={SAMPLE_PROPS}
        calculateMetadata={calculateShortMetadata}
      />
      <Composition
        id="HeroVideo"
        component={HeroVideo}
        durationInFrames={1800}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={HERO_SAMPLE_PROPS}
        calculateMetadata={calculateHeroMetadata}
      />
    </>
  );
};
