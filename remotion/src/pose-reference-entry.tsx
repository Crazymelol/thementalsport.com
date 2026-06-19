import React from 'react';
import {registerRoot, Still} from 'remotion';
import {PoseReference} from './PoseReference';

const PoseReferenceRoot: React.FC = () => (
  <Still
    id="PoseReference"
    component={PoseReference}
    width={1024}
    height={1024}
    defaultProps={{pose: 'RestingWB'}}
  />
);

registerRoot(PoseReferenceRoot);
