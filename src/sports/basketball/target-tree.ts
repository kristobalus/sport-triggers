import { StudioTargetTree } from '../../models/studio/studio.target-tree'

import { Sources } from './sources'
import { GameLevel } from './game-level'

export const targetTree: StudioTargetTree = {
  [Sources.GameLevel]: {
    [GameLevel.Start]: {
      label: 'Start of Game',
    },
    [GameLevel.End]: {
      label: 'End of Game',
    },
    [GameLevel.HalfStart]: {
      label: 'Start of Half',
    },
    [GameLevel.HalfEnd]: {
      label: 'End of Half ',
    },

    [GameLevel.QuarterStart]: {
      label: 'Start of Quarter',
    },
    [GameLevel.QuarterEnd]: {
      label: 'End of Quarter',
    },
  },
}
