import React from 'react';
import Peep from 'react-peeps';
import {AbsoluteFill} from 'remotion';
import type {StandingPoseType} from 'react-peeps';

// Throwaway: renders one Open Peeps pose as a flat, high-contrast reference
// image for ControlNet pose conditioning (scripts/character/generate.py).
// Deleted once Tier 3 art is live (see Task 5).
export const PoseReference: React.FC<{pose: StandingPoseType}> = ({pose}) => (
  <AbsoluteFill
    style={{backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center'}}
  >
    <Peep
      body={pose}
      face="Calm"
      hair="Short"
      strokeColor="#000000"
      backgroundColor="#000000"
      style={{height: '90%', width: 'auto', display: 'block'}}
    />
  </AbsoluteFill>
);
