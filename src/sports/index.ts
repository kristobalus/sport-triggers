
import { metadata as baseballMetadata } from './baseball/metadata'
import { metadata as footballMetadata } from './football/metadata'
import { metadata as basketballMetadata } from './basketball/metadata'
import { targetTree as baseballTargetTree } from './baseball/target-tree'
import { targetTree as basketballTargetTree } from './basketball/target-tree'

import { limits as basketballLimits } from './basketball/limits'
import { limits as baseballLimits } from './baseball/limits'
import { limits as commonLimits } from './common-limits'

export const metadata = {
  ...footballMetadata,
  ...basketballMetadata,
  ...baseballMetadata
}

export const targetTree = {
  ...baseballTargetTree,
  ...basketballTargetTree
}

export const limits = {
  ...basketballLimits,
  ...baseballLimits,
  ...commonLimits
}

