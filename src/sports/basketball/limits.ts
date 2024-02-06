import { EventLimit } from '../../models/events/event-limit'
import { Sport } from '../../models/events/sport'

import { BasketballEvents } from './basketball-events'

export const limits: Record<string, EventLimit> = {
  [BasketballEvents.Sequence]: {
    label: 'per sequence',
    description: 'Should occur N times per sequence',
    finite: false,
    sport: Sport.Basketball
  }
}
