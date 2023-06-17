
import { BaseEvent } from "./base.event"

// @ts-ignore
interface GameLevelEvent extends BaseEvent {
  name: "game.level"
  value: "game.start" | "game.quarter.start" | "game.half.start" | "game.quarter.end" | "game.half.end" | "game.end" | "game.under_review"
}

