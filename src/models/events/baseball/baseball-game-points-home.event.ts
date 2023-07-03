
import { Event } from '../event'

import { BaseballEvents } from './baseball-events'

export interface BaseballGamePointsHomeEvent extends Event {
  name: BaseballEvents.GamePointsHome
  value: string
}
