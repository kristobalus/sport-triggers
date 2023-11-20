
import { EventLimit } from '../../models/events/event-limit'
import { BaseballEvents } from './baseball-events'
import { Sport } from '../../models/events/sport'

export const limits: Record<string, EventLimit> = {
  [BaseballEvents.InningNumber]: {
    label: "per inning",
    description: "Should occur N times per inning",
    finite: false,
    sport: Sport.Baseball
  },
  [BaseballEvents.InningHalf]: {
    label: "per inning half",
    description: "Should occur N times per inning half",
    finite: false,
    sport: Sport.Baseball
  }
}
