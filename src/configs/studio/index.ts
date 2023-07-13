
import { metadata as baseballMetadata } from './baseball/metadata'
import { metadata as footballMetadata } from './football/metadata'
import { metadata as basketballMetadata } from './basketball/metadata'

export const metadata = {
  ...footballMetadata,
  ...basketballMetadata,
  ...baseballMetadata
}

