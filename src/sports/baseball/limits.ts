
import { EventLimit } from '../../models/events/event-limit'
import { Sport } from '../../models/events/sport'

import { BaseballEvents } from './baseball-events'

export const limits: Record<string, EventLimit> = {
  [BaseballEvents.InningNumber]: {
    label: 'per inning',
    description: 'Should occur N times per inning',
    finite: false,
    sport: Sport.Baseball
  },
  [BaseballEvents.InningHalf]: {
    label: 'per inning half',
    description: 'Should occur N times per inning half',
    finite: false,
    sport: Sport.Baseball
  }
}
