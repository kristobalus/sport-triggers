import { ConditionType } from '../entities/trigger-condition'

import { metadata as baseballMetadata } from './baseball/baseball-metadata'
import { metadata as footballMetadata } from './football/football-metadata'
import { metadata as basketballMetadata } from './basketball/basketball-metadata'

export interface EventMetadata {
  sport: string
  input: boolean
  targets?: string[]
  compare?: string[]
  type: ConditionType
}

// TODO add nomenclature data for datasources
export const metadata: Record<string, EventMetadata> = {
  ...footballMetadata,
  ...basketballMetadata,
  ...baseballMetadata
}
