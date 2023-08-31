import { StudioEvent } from './studio.event'
import { StudioTarget } from './studio.target'
import { Game } from './game'

export interface TargetList {
  targets: StudioTarget[]
}

export interface StudioConfigData {
  index: string[]
  game: Pick<Game, 'id' | 'datasource' | 'scope' | 'sport' >
  events: Record<string, StudioEvent>
  sources: Record<string, TargetList>
}
