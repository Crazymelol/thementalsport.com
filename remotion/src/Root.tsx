import React from 'react';
import {Composition} from 'remotion';
import {ShortVideo, calculateShortMetadata} from './ShortVideo';

const SAMPLE_PROPS = {
  hook: "What you say in the car after the game matters more than anything the coach said.",
  script:
    "Don't open with the scoreboard. Don't open with the mistakes. Open with one sentence: 'I love watching you play.' Full stop. If they want to talk tactics, let THEM bring it up. Then praise one thing they controlled: 'I noticed how you kept battling after that mistake.' Not talent. Not the result. Effort and response. That's how confidence survives a bad game.",
  cta: 'Free mental-game guide for sports parents — link in description.',
  bookTitle: 'The Competition Protocol',
  audience: 'parents',
};

export const RemotionRoot: React.FC = () => {
  return (
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
  );
};
