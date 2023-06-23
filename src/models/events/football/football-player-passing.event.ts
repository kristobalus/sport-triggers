
import { Event } from "../event"

import { FootballEvents } from "./football-events"
import { Player } from "../player"

export interface FootballPlayerPassingEvent extends Event, Player {
  name: FootballEvents.PlayerPassing
}
