
import { metadata as baseballMetadata } from './baseball/metadata'
import { metadata as footballMetadata } from './football/metadata'
import { metadata as basketballMetadata } from './basketball/metadata'

import { targetTree as baseballTargetTree } from './baseball/target-tree'

export const metadata = {
  ...footballMetadata,
  ...basketballMetadata,
  ...baseballMetadata
}

export const targetTree = {
  ...baseballTargetTree
}
