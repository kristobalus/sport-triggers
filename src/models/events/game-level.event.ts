import { BaseEvent } from "./base.event"

export interface GameLevelEvent extends BaseEvent {
  name: "game.level"
}
