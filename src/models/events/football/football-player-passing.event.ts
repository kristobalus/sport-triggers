
import { Event } from "../event"
import { Player } from "../player"

import { FootballEvents } from "./football-events"

export interface FootballPlayerPassingEvent extends Event, Player {
  name: FootballEvents.PlayerPassing
}
