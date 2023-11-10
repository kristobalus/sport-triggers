import { BasketballEvents } from './basketball-events'
import { EventLimit } from '../../models/events/event-limit'
import { Sport } from '../../models/events/sport'

export const limits: Record<string, EventLimit> = {
  [BasketballEvents.Sequence]: {
    label: "Limit per sequence",
    description: "Should occur N times per sequence",
    finite: false,
    sport: Sport.Basketball
  }
}
